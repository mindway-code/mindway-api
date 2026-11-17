import { prisma } from "../prisma/client.js";
import type {
  CreateReportWithRevisionInput,
  ListReportsChildrenParams,
  ListReportsChildrenResult,
  ReportAggregateRecord,
  ReportRevisionRecord,
  UpdateDraftRevisionInput,
} from "../../../api/v1/modules/reportsChildren/reportsChildren.types.js";

const revisionSelect = {
  id: true,
  reportId: true,
  revisionNumber: true,
  createdById: true,
  status: true,
  title: true,
  behavior: true,
  difficulty: true,
  recommendation: true,
  contentHash: true,
  submittedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
} as const;

const aggregateSelect = {
  id: true,
  childId: true,
  userId: true,
  userRole: true,
  currentRevisionNumber: true,
  publishedRevisionNumber: true,
  archivedAt: true,
  archivedById: true,
  user: { select: { id: true, name: true, email: true } },
  revisions: { select: revisionSelect, orderBy: { revisionNumber: "desc" as const } },
  createdAt: true,
  updatedAt: true,
} as const;

export async function listReportAggregatesByChild(childId: string, params: ListReportsChildrenParams = {}): Promise<ListReportsChildrenResult> {
  const { skip = 0, take = 20 } = params;
  const where = { childId, archivedAt: null };
  const [items, total] = await prisma.$transaction([
    prisma.reportsChild.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: aggregateSelect }),
    prisma.reportsChild.count({ where }),
  ]);
  return { items: items as unknown as ReportAggregateRecord[], total };
}

export async function loadReportAggregate(id: string): Promise<ReportAggregateRecord | null> {
  return prisma.reportsChild.findUnique({ where: { id }, select: aggregateSelect }) as unknown as Promise<ReportAggregateRecord | null>;
}

export async function createReportWithInitialRevision(input: CreateReportWithRevisionInput): Promise<ReportAggregateRecord> {
  const reportId = await prisma.$transaction(async (tx) => {
    const report = await tx.reportsChild.create({
      data: {
        childId: input.childId,
        userId: input.userId,
        userRole: input.userRole,
        title: input.title,
        behavior: input.behavior,
        difficulty: input.difficulty,
        recommendation: input.recommendation,
        currentRevisionNumber: 1,
      },
      select: { id: true },
    });
    await tx.reportRevision.create({
      data: {
        reportId: report.id,
        revisionNumber: 1,
        createdById: input.userId,
        status: "DRAFT",
        title: input.title,
        behavior: input.behavior,
        difficulty: input.difficulty,
        recommendation: input.recommendation,
        contentHash: input.contentHash,
      },
    });
    return report.id;
  });
  return (await loadReportAggregate(reportId))!;
}

export async function updateDraftRevision(input: UpdateDraftRevisionInput): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const revision = await tx.reportRevision.updateMany({
      where: { reportId: input.reportId, revisionNumber: input.revisionNumber, status: "DRAFT" },
      data: {
        title: input.title,
        behavior: input.behavior,
        difficulty: input.difficulty,
        recommendation: input.recommendation,
        contentHash: input.contentHash,
      },
    });
    if (revision.count !== 1) return false;
    const aggregate = await tx.reportsChild.updateMany({
      where: { id: input.reportId, currentRevisionNumber: input.revisionNumber, archivedAt: null },
      data: {
        title: input.title,
        behavior: input.behavior,
        difficulty: input.difficulty,
        recommendation: input.recommendation,
      },
    });
    if (aggregate.count !== 1) throw new Error("Report aggregate changed during draft update");
    return true;
  });
}

export async function submitDraftRevision(params: { reportId: string; revisionNumber: number; contentHash: string }): Promise<boolean> {
  const result = await prisma.reportRevision.updateMany({
    where: { reportId: params.reportId, revisionNumber: params.revisionNumber, status: "DRAFT" },
    data: { status: "SUBMITTED", submittedAt: new Date(), contentHash: params.contentHash },
  });
  return result.count === 1;
}

export async function createNextDraftRevision(params: {
  reportId: string;
  createdById: string;
  expectedCurrentRevisionNumber: number;
  baseRevision: ReportRevisionRecord;
  contentHash: string;
}): Promise<boolean> {
  const nextRevisionNumber = params.expectedCurrentRevisionNumber + 1;
  try {
    return await prisma.$transaction(async (tx) => {
      const aggregate = await tx.reportsChild.updateMany({
        where: {
          id: params.reportId,
          archivedAt: null,
          currentRevisionNumber: params.expectedCurrentRevisionNumber,
          publishedRevisionNumber: params.baseRevision.revisionNumber,
        },
        data: {
          currentRevisionNumber: nextRevisionNumber,
          title: params.baseRevision.title,
          behavior: params.baseRevision.behavior,
          difficulty: params.baseRevision.difficulty,
          recommendation: params.baseRevision.recommendation,
        },
      });
      if (aggregate.count !== 1) return false;
      await tx.reportRevision.create({
        data: {
          reportId: params.reportId,
          revisionNumber: nextRevisionNumber,
          createdById: params.createdById,
          status: "DRAFT",
          title: params.baseRevision.title,
          behavior: params.baseRevision.behavior,
          difficulty: params.baseRevision.difficulty,
          recommendation: params.baseRevision.recommendation,
          contentHash: params.contentHash,
        },
      });
      return true;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return false;
    throw error;
  }
}

export async function markRevisionRejected(params: { reportId: string; revisionNumber: number; reason: string }): Promise<boolean> {
  const result = await prisma.reportRevision.updateMany({
    where: { reportId: params.reportId, revisionNumber: params.revisionNumber, status: "SUBMITTED" },
    data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: params.reason },
  });
  return result.count === 1;
}

export async function listReportRevisionHistory(reportId: string): Promise<ReportRevisionRecord[]> {
  return prisma.reportRevision.findMany({ where: { reportId }, orderBy: { revisionNumber: "desc" }, select: revisionSelect }) as unknown as Promise<ReportRevisionRecord[]>;
}

export async function archiveReportAggregate(params: { reportId: string; archivedById: string }): Promise<boolean> {
  const result = await prisma.reportsChild.updateMany({
    where: { id: params.reportId, archivedAt: null },
    data: { archivedAt: new Date(), archivedById: params.archivedById },
  });
  return result.count === 1;
}
