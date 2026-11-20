import { pagination } from "../../../../utils/pagination.js";
import { invalidateCachePatterns } from "../../../../utils/cache.js";
import { badRequest, forbidden, mfaError, notFound, reportError } from "../../../../core/errors/httpError.js";
import type { UserRole } from "../../../../utils/crypto/jwt.js";
import { calculateReportContentHash } from "../../../../utils/crypto/contentHash.js";
import type { ChildWithAccessCodeRecord } from "../children/children.types.js";
import { getChildById } from "../../../../infra/database/repositories/children.repository.js";
import { createAssociationChild, findAssociationByUserAndChild } from "../../../../infra/database/repositories/associationChildren.repository.js";
import {
  archiveReportAggregate,
  createNextDraftRevision,
  createReportWithInitialRevision,
  listReportAggregatesByChild,
  listReportRevisionHistory,
  loadReportAggregate,
  markRevisionRejected,
  submitDraftRevision,
  updateDraftRevision,
  validateReportRevisionTransaction,
} from "../../../../infra/database/repositories/reportsChildren.repository.js";
import type {
  CreateReportsChildDTO,
  ListReportsChildrenResponse,
  RejectReportDTO,
  ReportAggregateRecord,
  ReportContentFields,
  ReportRevisionRecord,
  ReportRevisionView,
  ReportView,
  UpdateReportsChildDTO,
  ValidateReportDTO,
  StepUpContext,
} from "./reportsChildren.types.js";
import { decideReportCapabilities } from "./reportsChildren.policy.js";

type ChildAccessContext = {
  isAdmin: boolean;
  isResponsible: boolean;
  isSecondaryResponsible: boolean;
  isAssociated: boolean;
  hasAccess: boolean;
};

export type ReportsChildrenServiceDeps = {
  pagination: typeof pagination;
  badRequest: typeof badRequest;
  forbidden: typeof forbidden;
  notFound: typeof notFound;
  reportError: typeof reportError;
  mfaError: typeof mfaError;
  calculateReportContentHash: typeof calculateReportContentHash;
  getChildById: typeof getChildById;
  findAssociationByUserAndChild: typeof findAssociationByUserAndChild;
  createAssociationChild: typeof createAssociationChild;
  listReportAggregatesByChild: typeof listReportAggregatesByChild;
  loadReportAggregate: typeof loadReportAggregate;
  createReportWithInitialRevision: typeof createReportWithInitialRevision;
  updateDraftRevision: typeof updateDraftRevision;
  submitDraftRevision: typeof submitDraftRevision;
  createNextDraftRevision: typeof createNextDraftRevision;
  markRevisionRejected: typeof markRevisionRejected;
  listReportRevisionHistory: typeof listReportRevisionHistory;
  archiveReportAggregate: typeof archiveReportAggregate;
  validateReportRevisionTransaction: typeof validateReportRevisionTransaction;
};

const CHILDREN_CACHE_PATTERNS = ["children:list:*", "children:accessible:*"];

function isUniqueConstraintError(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

async function invalidateChildrenCache() {
  await invalidateCachePatterns(CHILDREN_CACHE_PATTERNS);
}

function revisionView(revision: ReportRevisionRecord): ReportRevisionView {
  return {
    id: revision.id,
    revisionNumber: revision.revisionNumber,
    status: revision.status,
    contentHash: revision.contentHash,
    title: revision.title,
    behavior: revision.behavior,
    difficulty: revision.difficulty,
    recommendation: revision.recommendation,
    submittedAt: revision.submittedAt,
    rejectedAt: revision.rejectedAt,
    rejectionReason: revision.rejectionReason,
    createdAt: revision.createdAt,
    updatedAt: revision.updatedAt,
  };
}

function findRevision(report: ReportAggregateRecord, revisionNumber: number | null): ReportRevisionRecord | null {
  if (revisionNumber === null) return null;
  return report.revisions.find((revision) => revision.revisionNumber === revisionNumber) ?? null;
}

function currentRevision(report: ReportAggregateRecord): ReportRevisionRecord {
  const revision = findRevision(report, report.currentRevisionNumber);
  if (!revision) throw reportError({ code: "REPORT_REVISION_CONFLICT", message: "Current report revision is unavailable" });
  return revision;
}

async function buildChildAccessContext(
  deps: ReportsChildrenServiceDeps,
  params: { requesterId: string; requesterRole: UserRole; childId: string },
): Promise<ChildAccessContext> {
  const child = await deps.getChildById(params.childId);
  if (!child) throw deps.notFound("Child not found");
  const isAdmin = params.requesterRole === "admin";
  const isResponsible = child.responsibleId === params.requesterId;
  const isSecondaryResponsible = child.secondaryResponsibleId === params.requesterId;
  const isAssociated = !!(await deps.findAssociationByUserAndChild(params.requesterId, params.childId));
  return {
    isAdmin,
    isResponsible,
    isSecondaryResponsible,
    isAssociated,
    hasAccess: isAdmin || isResponsible || isSecondaryResponsible || isAssociated,
  };
}

async function ensureAccessByChildId(
  deps: ReportsChildrenServiceDeps,
  params: { requesterId: string; requesterRole: UserRole; childId: string },
) {
  const context = await buildChildAccessContext(deps, params);
  if (!context.hasAccess) throw deps.forbidden("You do not have access to this child.");
  return context;
}

function toReportView(params: {
  report: ReportAggregateRecord;
  context: ChildAccessContext;
  requesterId: string;
  requesterRole: UserRole;
}): ReportView {
  const { report, context, requesterId, requesterRole } = params;
  const current = currentRevision(report);
  const published = findRevision(report, report.publishedRevisionNumber);
  const canInspectWorkingRevision = requesterId === report.userId || requesterRole === "admin";
  const displayRevision = canInspectWorkingRevision ? current : published ?? current;
  const validatedRevision = published ?? (displayRevision.status === "VALIDATED" ? displayRevision : null);
  const activeValidation = validatedRevision?.validations?.find(
    (validation) => validation.type === "AUTHOR_ATTESTATION" && validation.revokedAt === null,
  );
  const capabilities = decideReportCapabilities({
    requesterId,
    requesterRole,
    reportAuthorId: report.userId,
    isResponsible: context.isResponsible,
    isSecondaryResponsible: context.isSecondaryResponsible,
    isAssociated: context.isAssociated,
    currentStatus: current.status,
    publishedRevisionNumber: report.publishedRevisionNumber,
    archived: report.archivedAt !== null,
  });
  return {
    id: report.id,
    childId: report.childId,
    userRole: report.userRole,
    author: report.user,
    lifecycle: {
      status: displayRevision.status,
      currentRevisionNumber: report.currentRevisionNumber,
      publishedRevisionNumber: report.publishedRevisionNumber,
      hasUnpublishedChanges:
        report.publishedRevisionNumber === null
          ? current.status !== "LEGACY_UNVALIDATED"
          : report.currentRevisionNumber !== report.publishedRevisionNumber,
    },
    revision: revisionView(displayRevision),
    validation: activeValidation && validatedRevision
      ? {
          id: activeValidation.id,
          type: activeValidation.type,
          method: activeValidation.method,
          validatedAt: activeValidation.validatedAt,
          validator: activeValidation.validator,
          revisionNumber: validatedRevision.revisionNumber,
        }
      : null,
    capabilities,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

function normalizeContent(dto: CreateReportsChildDTO): ReportContentFields {
  return {
    title: dto.title.trim(),
    behavior: dto.behavior ?? null,
    difficulty: dto.difficulty ?? null,
    recommendation: dto.recommendation ?? null,
  };
}

export function makeReportsChildrenServices(deps: ReportsChildrenServiceDeps) {
  async function loadAccessibleReport(params: { requesterId: string; requesterRole: UserRole; reportId: string }) {
    const report = await deps.loadReportAggregate(params.reportId);
    if (!report) throw deps.notFound("Report not found");
    if (report.archivedAt) throw deps.reportError({ code: "REPORT_ARCHIVED", message: "Report is archived" });
    const context = await ensureAccessByChildId(deps, { ...params, childId: report.childId });
    return { report, context };
  }

  async function listReportsByChildService(params: {
    requesterId: string;
    requesterRole: UserRole;
    childId: string;
    pageRaw: unknown;
    pageSizeRaw: unknown;
  }): Promise<ListReportsChildrenResponse> {
    if (!params.requesterId) throw deps.badRequest("requesterId is required");
    if (!params.childId) throw deps.badRequest("childId is required");
    const context = await ensureAccessByChildId(deps, params);
    const { page, pageSize, skip, take } = deps.pagination(params.pageRaw, params.pageSizeRaw);
    const { items, total } = await deps.listReportAggregatesByChild(params.childId, { skip, take });
    return {
      items: items.map((report) => toReportView({ report, context, requesterId: params.requesterId, requesterRole: params.requesterRole })),
      meta: { pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } },
    };
  }

  async function createReportForChildService(params: {
    requesterId: string;
    requesterRole: UserRole;
    childId: string;
    dto: CreateReportsChildDTO;
  }): Promise<ReportView> {
    const content = normalizeContent(params.dto);
    if (!content.title) throw deps.badRequest("title is required");
    let context = await buildChildAccessContext(deps, params);
    if (!context.hasAccess) {
      const accessCode = params.dto.accessCode?.trim();
      if (!accessCode) throw deps.forbidden("You do not have access to this child.");
      const child = (await deps.getChildById(params.childId, { includeAccessCode: true })) as ChildWithAccessCodeRecord | null;
      if (!child) throw deps.notFound("Child not found");
      if (child.accessCode !== accessCode) throw deps.notFound("Invalid child access code.");
      try {
        await deps.createAssociationChild(params.requesterId, params.childId);
        await invalidateChildrenCache();
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
      }
      context = { ...context, isAssociated: true, hasAccess: true };
    }
    const report = await deps.createReportWithInitialRevision({
      ...content,
      childId: params.childId,
      userId: params.requesterId,
      userRole: params.requesterRole,
      contentHash: deps.calculateReportContentHash(content),
    });
    return toReportView({ report, context, requesterId: params.requesterId, requesterRole: params.requesterRole });
  }

  async function getReportByIdService(params: { requesterId: string; requesterRole: UserRole; reportId: string }) {
    const { report, context } = await loadAccessibleReport(params);
    return toReportView({ report, context, requesterId: params.requesterId, requesterRole: params.requesterRole });
  }

  async function updateReportService(params: {
    requesterId: string;
    requesterRole: UserRole;
    reportId: string;
    dto: UpdateReportsChildDTO;
  }) {
    if (Object.keys(params.dto).length === 0) throw deps.badRequest("No fields to update");
    const { report, context } = await loadAccessibleReport(params);
    const current = currentRevision(report);
    const capabilities = toReportView({ report, context, requesterId: params.requesterId, requesterRole: params.requesterRole }).capabilities;
    if (!capabilities.canEditDraft) {
      if (current.status !== "DRAFT") throw deps.reportError({ code: "REPORT_NOT_EDITABLE", message: "Only the current draft can be edited" });
      throw deps.forbidden();
    }
    const content: ReportContentFields = {
      title: params.dto.title !== undefined ? params.dto.title.trim() : current.title,
      behavior: params.dto.behavior !== undefined ? params.dto.behavior : current.behavior,
      difficulty: params.dto.difficulty !== undefined ? params.dto.difficulty : current.difficulty,
      recommendation: params.dto.recommendation !== undefined ? params.dto.recommendation : current.recommendation,
    };
    if (!content.title) throw deps.badRequest("title cannot be empty");
    const updated = await deps.updateDraftRevision({
      ...content,
      reportId: report.id,
      revisionNumber: report.currentRevisionNumber,
      contentHash: deps.calculateReportContentHash(content),
    });
    if (!updated) throw deps.reportError({ code: "REPORT_REVISION_CONFLICT", message: "Draft changed concurrently" });
    return getReportByIdService(params);
  }

  async function submitReportService(params: { requesterId: string; requesterRole: UserRole; reportId: string }) {
    const { report, context } = await loadAccessibleReport(params);
    const current = currentRevision(report);
    const capabilities = toReportView({ report, context, requesterId: params.requesterId, requesterRole: params.requesterRole }).capabilities;
    if (!capabilities.canSubmit) {
      if (current.status === "SUBMITTED") throw deps.reportError({ code: "REPORT_ALREADY_SUBMITTED", message: "Report is already submitted" });
      if (current.status !== "DRAFT") throw deps.reportError({ code: "REPORT_NOT_DRAFT", message: "Only a draft can be submitted" });
      throw deps.forbidden();
    }
    if (!current.title.trim()) throw deps.badRequest("title is required");
    const submitted = await deps.submitDraftRevision({
      reportId: report.id,
      revisionNumber: report.currentRevisionNumber,
      contentHash: deps.calculateReportContentHash(current),
    });
    if (!submitted) throw deps.reportError({ code: "REPORT_REVISION_CONFLICT", message: "Report submission conflicted with another transition" });
    return getReportByIdService(params);
  }

  async function createNextRevisionService(params: { requesterId: string; requesterRole: UserRole; reportId: string }) {
    const { report, context } = await loadAccessibleReport(params);
    const view = toReportView({ report, context, requesterId: params.requesterId, requesterRole: params.requesterRole });
    if (!view.capabilities.canCreateRevision) throw deps.reportError({ code: "REPORT_NOT_EDITABLE", message: "A new revision cannot be created now" });
    const published = findRevision(report, report.publishedRevisionNumber);
    if (!published) throw deps.reportError({ code: "REPORT_REVISION_CONFLICT", message: "Published revision is unavailable" });
    const created = await deps.createNextDraftRevision({
      reportId: report.id,
      createdById: params.requesterId,
      expectedCurrentRevisionNumber: report.currentRevisionNumber,
      baseRevision: published,
      contentHash: deps.calculateReportContentHash(published),
    });
    if (!created) throw deps.reportError({ code: "REPORT_REVISION_CONFLICT", message: "Revision was created concurrently" });
    return getReportByIdService(params);
  }

  async function rejectReportService(params: { requesterId: string; requesterRole: UserRole; reportId: string; dto: RejectReportDTO }) {
    const { report } = await loadAccessibleReport(params);
    if (params.requesterRole !== "admin") throw deps.forbidden();
    const reason = params.dto.reason.trim();
    if (!reason) throw deps.badRequest("rejection reason is required");
    const current = currentRevision(report);
    if (current.status !== "SUBMITTED") throw deps.reportError({ code: "REPORT_NOT_DRAFT", message: "Only a submitted report can be rejected" });
    const rejected = await deps.markRevisionRejected({ reportId: report.id, revisionNumber: report.currentRevisionNumber, reason });
    if (!rejected) throw deps.reportError({ code: "REPORT_REVISION_CONFLICT", message: "Report rejection conflicted with another transition" });
    return getReportByIdService(params);
  }

  async function listRevisionHistoryService(params: { requesterId: string; requesterRole: UserRole; reportId: string }) {
    await loadAccessibleReport(params);
    return (await deps.listReportRevisionHistory(params.reportId)).map(revisionView);
  }

  async function deleteReportService(params: { requesterId: string; requesterRole: UserRole; reportId: string }) {
    const { report, context } = await loadAccessibleReport(params);
    const capabilities = toReportView({ report, context, requesterId: params.requesterId, requesterRole: params.requesterRole }).capabilities;
    if (!capabilities.canArchive) throw deps.forbidden();
    const archived = await deps.archiveReportAggregate({ reportId: report.id, archivedById: params.requesterId });
    if (!archived) throw deps.reportError({ code: "REPORT_ARCHIVED", message: "Report is already archived" });
    return { id: report.id };
  }

  async function validateReportService(params: {
    requesterId: string;
    requesterRole: UserRole;
    reportId: string;
    idempotencyKey: string;
    requestId: string;
    dto: ValidateReportDTO;
    stepUp: StepUpContext;
  }) {
    if (!params.stepUp.idempotentReplay) {
      const { report, context } = await loadAccessibleReport(params);
      const view = toReportView({
        report,
        context,
        requesterId: params.requesterId,
        requesterRole: params.requesterRole,
      });
      if (!view.capabilities.canValidate) {
        const current = currentRevision(report);
        if (report.userId !== params.requesterId) {
          throw deps.reportError({
            code: "REPORT_VALIDATOR_NOT_ALLOWED",
            statusCode: 403,
            message: "Only the report author can attest this revision",
          });
        }
        if (current.status !== "SUBMITTED") {
          throw deps.reportError({ code: "REPORT_NOT_SUBMITTED", message: "Only a submitted revision can be validated" });
        }
        throw deps.forbidden();
      }
    }

    const result = await deps.validateReportRevisionTransaction({
      reportId: params.reportId,
      revisionId: params.dto.revisionId,
      expectedContentHash: params.dto.expectedContentHash,
      validatorId: params.requesterId,
      factorId: params.stepUp.factorId,
      method: params.stepUp.method,
      type: params.dto.type,
      idempotencyKey: params.idempotencyKey,
      requestId: params.requestId,
      idempotentReplay: params.stepUp.idempotentReplay,
    });

    switch (result.status) {
      case "REPORT_NOT_FOUND":
        throw deps.notFound("Report not found");
      case "REPORT_ARCHIVED":
        throw deps.reportError({ code: "REPORT_ARCHIVED", message: "Report is archived" });
      case "REPORT_REVISION_MISMATCH":
        throw deps.reportError({ code: "REPORT_REVISION_MISMATCH", message: "Revision does not match the current report revision" });
      case "REPORT_NOT_SUBMITTED":
        throw deps.reportError({ code: "REPORT_NOT_SUBMITTED", message: "Only a submitted revision can be validated" });
      case "REPORT_CONTENT_HASH_MISMATCH":
        throw deps.reportError({ code: "REPORT_CONTENT_HASH_MISMATCH", message: "Report content hash does not match" });
      case "REPORT_ALREADY_VALIDATED":
        throw deps.reportError({ code: "REPORT_ALREADY_VALIDATED", message: "Report revision is already validated" });
      case "REPORT_VALIDATOR_NOT_ALLOWED":
        throw deps.reportError({ code: "REPORT_VALIDATOR_NOT_ALLOWED", statusCode: 403, message: "Only the report author can attest this revision" });
      case "IDEMPOTENT_RESULT_MISSING":
        throw deps.mfaError({ code: "MFA_PROOF_ALREADY_USED", statusCode: 409, message: "MFA proof was already used" });
      default:
        return getReportByIdService({
          requesterId: params.requesterId,
          requesterRole: params.requesterRole,
          reportId: params.reportId,
        });
    }
  }

  return {
    listReportsByChildService,
    createReportForChildService,
    getReportByIdService,
    updateReportService,
    submitReportService,
    createNextRevisionService,
    rejectReportService,
    listRevisionHistoryService,
    deleteReportService,
    validateReportService,
  };
}

const defaultDeps: ReportsChildrenServiceDeps = {
  pagination,
  badRequest,
  forbidden,
  notFound,
  reportError,
  mfaError,
  calculateReportContentHash,
  getChildById,
  findAssociationByUserAndChild,
  createAssociationChild,
  listReportAggregatesByChild,
  loadReportAggregate,
  createReportWithInitialRevision,
  updateDraftRevision,
  submitDraftRevision,
  createNextDraftRevision,
  markRevisionRejected,
  listReportRevisionHistory,
  archiveReportAggregate,
  validateReportRevisionTransaction,
};

export const {
  listReportsByChildService,
  createReportForChildService,
  getReportByIdService,
  updateReportService,
  submitReportService,
  createNextRevisionService,
  rejectReportService,
  listRevisionHistoryService,
  deleteReportService,
  validateReportService,
} = makeReportsChildrenServices(defaultDeps);
