import { pagination } from "../../../../utils/pagination.js";
import { badRequest, forbidden, notFound } from "../../../../core/errors/httpError.js";
import type { UserRole } from "../../../../utils/crypto/jwt.js";
import type { ChildWithAccessCodeRecord } from "../children/children.types.js";
import { getChildById } from "../../../../infra/database/repositories/children.repository.js";
import {
  createAssociationChild,
  findAssociationByUserAndChild,
} from "../../../../infra/database/repositories/associationChildren.repository.js";
import {
  createReportsChild,
  deleteReportsChild,
  getReportsChildById,
  listReportsChildrenByChild,
  updateReportsChild,
} from "../../../../infra/database/repositories/reportsChildren.repository.js";
import type {
  CreateReportsChildDTO,
  CreateReportsChildInput,
  ListReportsChildrenResponse,
  ReportsChildRecord,
  UpdateReportsChildDTO,
  UpdateReportsChildInput,
} from "./reportsChildren.types.js";

type ChildAccessContext = {
  child: { id: string; responsibleId: string; secondaryResponsibleId: string | null };
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
  getChildById: typeof getChildById;
  findAssociationByUserAndChild: typeof findAssociationByUserAndChild;
  createAssociationChild: typeof createAssociationChild;
  listReportsChildrenByChild: typeof listReportsChildrenByChild;
  getReportsChildById: typeof getReportsChildById;
  createReportsChild: typeof createReportsChild;
  updateReportsChild: typeof updateReportsChild;
  deleteReportsChild: typeof deleteReportsChild;
};

function isUniqueConstraintError(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === "P2002";
}

async function buildChildAccessContext(deps: ReportsChildrenServiceDeps, params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<ChildAccessContext> {
  const { requesterId, requesterRole, childId } = params;

  const child = await deps.getChildById(childId);
  if (!child) throw deps.notFound("Child not found");

  const isAdmin = requesterRole === "admin";
  const isResponsible = child.responsibleId === requesterId;
  const isSecondaryResponsible = child.secondaryResponsibleId === requesterId;
  const isAssociated = !!(await deps.findAssociationByUserAndChild(requesterId, childId));

  const hasAccess = isAdmin || isResponsible || isSecondaryResponsible || isAssociated;

  return {
    child: { id: child.id, responsibleId: child.responsibleId, secondaryResponsibleId: child.secondaryResponsibleId ?? null },
    isAdmin,
    isResponsible,
    isSecondaryResponsible,
    isAssociated,
    hasAccess,
  };
}

async function ensureAccessByChildId(deps: ReportsChildrenServiceDeps, params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<ChildAccessContext> {
  const ctx = await buildChildAccessContext(deps, params);
  if (!ctx.hasAccess) throw deps.forbidden("You do not have access to this child.");
  return ctx;
}

function canManageReport(params: { ctx: ChildAccessContext; requesterId: string; report: { userId: string } }) {
  const { ctx, requesterId, report } = params;
  if (ctx.isAdmin) return true;
  if (ctx.isResponsible || ctx.isSecondaryResponsible) return true;
  return report.userId === requesterId;
}

export function makeReportsChildrenServices(deps: ReportsChildrenServiceDeps) {
  async function listReportsByChildService(params: {
    requesterId: string;
    requesterRole: UserRole;
    childId: string;
    pageRaw: unknown;
    pageSizeRaw: unknown;
  }): Promise<ListReportsChildrenResponse> {
    const { requesterId, requesterRole, childId, pageRaw, pageSizeRaw } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");
    if (!childId) throw deps.badRequest("childId is required");

    await ensureAccessByChildId(deps, { requesterId, requesterRole, childId });

    const { page, pageSize, skip, take } = deps.pagination(pageRaw, pageSizeRaw);
    const { items, total } = await deps.listReportsChildrenByChild(childId, { skip, take });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
  }

  async function createReportForChildService(params: {
    requesterId: string;
    requesterRole: UserRole;
    childId: string;
    dto: CreateReportsChildDTO;
  }): Promise<ReportsChildRecord> {
    const { requesterId, requesterRole, childId, dto } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");
    if (!childId) throw deps.badRequest("childId is required");

    const title = dto?.title?.trim();
    if (!title) throw deps.badRequest("title is required");

    // Access rule:
    // - Responsible/secondary/associated/admin can create.
    // - If requester has no access, allow creating an association only when a valid accessCode is provided for this child.
    const baseCtx = await buildChildAccessContext(deps, { requesterId, requesterRole, childId });
    if (!baseCtx.hasAccess) {
      const accessCode = dto?.accessCode?.trim();
      if (!accessCode) throw deps.forbidden("You do not have access to this child.");

      const childWithCode = (await deps.getChildById(childId, { includeAccessCode: true })) as ChildWithAccessCodeRecord | null;
      if (!childWithCode) throw deps.notFound("Child not found");

      if (childWithCode.accessCode !== accessCode) throw deps.notFound("Invalid child access code.");

      try {
        await deps.createAssociationChild(requesterId, childId);
      } catch (err) {
        if (!isUniqueConstraintError(err)) throw err;
      }
    }

    const input: CreateReportsChildInput = {
      childId,
      userId: requesterId,
      userRole: requesterRole,
      title,
      behavior: dto.behavior ?? null,
      difficulty: dto.difficulty ?? null,
      recommendation: dto.recommendation ?? null,
    };

    return deps.createReportsChild(input);
  }

  async function getReportByIdService(params: { requesterId: string; requesterRole: UserRole; reportId: string }): Promise<ReportsChildRecord> {
    const { requesterId, requesterRole, reportId } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");
    if (!reportId) throw deps.badRequest("reportId is required");

    const report = await deps.getReportsChildById(reportId);
    if (!report) throw deps.notFound("Report not found");

    await ensureAccessByChildId(deps, { requesterId, requesterRole, childId: report.childId });

    return report;
  }

  async function updateReportService(params: {
    requesterId: string;
    requesterRole: UserRole;
    reportId: string;
    dto: UpdateReportsChildDTO;
  }): Promise<ReportsChildRecord> {
    const { requesterId, requesterRole, reportId, dto } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");
    if (!reportId) throw deps.badRequest("reportId is required");

    const existing = await deps.getReportsChildById(reportId);
    if (!existing) throw deps.notFound("Report not found");

    const ctx = await ensureAccessByChildId(deps, { requesterId, requesterRole, childId: existing.childId });
    if (!canManageReport({ ctx, requesterId, report: existing })) throw deps.forbidden();

    const input: UpdateReportsChildInput = {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.behavior !== undefined ? { behavior: dto.behavior } : {}),
      ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
      ...(dto.recommendation !== undefined ? { recommendation: dto.recommendation } : {}),
    };

    if (dto.title !== undefined && !input.title) throw deps.badRequest("title cannot be empty");
    if (Object.keys(input).length === 0) throw deps.badRequest("No fields to update");

    return deps.updateReportsChild(reportId, input);
  }

  async function deleteReportService(params: { requesterId: string; requesterRole: UserRole; reportId: string }): Promise<{ id: string }> {
    const { requesterId, requesterRole, reportId } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");
    if (!reportId) throw deps.badRequest("reportId is required");

    const existing = await deps.getReportsChildById(reportId);
    if (!existing) throw deps.notFound("Report not found");

    const ctx = await ensureAccessByChildId(deps, { requesterId, requesterRole, childId: existing.childId });
    if (!canManageReport({ ctx, requesterId, report: existing })) throw deps.forbidden();

    return deps.deleteReportsChild(reportId);
  }

  return {
    listReportsByChildService,
    createReportForChildService,
    getReportByIdService,
    updateReportService,
    deleteReportService,
  };
}

const defaultDeps: ReportsChildrenServiceDeps = {
  pagination,
  badRequest,
  forbidden,
  notFound,
  getChildById,
  findAssociationByUserAndChild,
  createAssociationChild,
  listReportsChildrenByChild,
  getReportsChildById,
  createReportsChild,
  updateReportsChild,
  deleteReportsChild,
};

export const {
  listReportsByChildService,
  createReportForChildService,
  getReportByIdService,
  updateReportService,
  deleteReportService,
} = makeReportsChildrenServices(defaultDeps);

export default {
  listReportsByChildService,
  createReportForChildService,
  getReportByIdService,
  updateReportService,
  deleteReportService,
};

