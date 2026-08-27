import { prisma } from "../prisma/client.js";
import type {
  CreateReportsChildInput,
  DeleteReportsChildResult,
  ListReportsChildrenParams,
  ListReportsChildrenResult,
  ReportsChildRecord,
  UpdateReportsChildInput,
} from "../../../api/v1/modules/reportsChildren/reportsChildren.types.js";

const reportsChildSelect = {
  id: true,
  childId: true,
  userId: true,
  userRole: true,
  title: true,
  behavior: true,
  difficulty: true,
  recommendation: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

export async function listReportsChildrenByChild(childId: string, params: ListReportsChildrenParams = {}): Promise<ListReportsChildrenResult> {
  const { skip = 0, take = 20 } = params;
  const where = { childId };

  const [items, total] = await prisma.$transaction([
    prisma.reportsChild.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }],
      select: reportsChildSelect,
    }),
    prisma.reportsChild.count({ where }),
  ]);

  return { items: items as unknown as ReportsChildRecord[], total };
}

export async function getReportsChildById(id: string): Promise<ReportsChildRecord | null> {
  return prisma.reportsChild.findUnique({
    where: { id },
    select: reportsChildSelect,
  }) as Promise<ReportsChildRecord | null>;
}

export async function createReportsChild(input: CreateReportsChildInput): Promise<ReportsChildRecord> {
  const created = await prisma.reportsChild.create({
    data: {
      childId: input.childId,
      userId: input.userId,
      userRole: input.userRole,
      title: input.title,
      behavior: input.behavior ?? null,
      difficulty: input.difficulty ?? null,
      recommendation: input.recommendation ?? null,
    },
    select: reportsChildSelect,
  });

  return created as unknown as ReportsChildRecord;
}

export async function updateReportsChild(id: string, input: UpdateReportsChildInput): Promise<ReportsChildRecord> {
  const updated = await prisma.reportsChild.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.behavior !== undefined ? { behavior: input.behavior } : {}),
      ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
      ...(input.recommendation !== undefined ? { recommendation: input.recommendation } : {}),
    },
    select: reportsChildSelect,
  });

  return updated as unknown as ReportsChildRecord;
}

export async function deleteReportsChild(id: string): Promise<DeleteReportsChildResult> {
  const deleted = await prisma.reportsChild.delete({
    where: { id },
    select: { id: true },
  });

  return deleted;
}

export default {
  listReportsChildrenByChild,
  getReportsChildById,
  createReportsChild,
  updateReportsChild,
  deleteReportsChild,
};
