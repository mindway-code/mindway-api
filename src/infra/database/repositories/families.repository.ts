import { prisma } from "../prisma/client.js";
import type {
  FamilyRecord,
  CreateFamilyInput,
  ListFamiliesResult,
  UpdateFamilyInput,
  DeleteFamilyResult,
} from "../../../api/v1/modules/families/families.types.js";

const familySelect = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createFamily(input: CreateFamilyInput): Promise<FamilyRecord> {
  const created = await prisma.family.create({
    data: {
      name: input.name,
    },
    select: familySelect,
  });

  return created as unknown as FamilyRecord;
}

export async function listFamilies(params: { skip: number; take: number }): Promise<ListFamiliesResult> {
  const { skip, take } = params;

  const [items, total] = await prisma.$transaction([
    prisma.family.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: familySelect,
    }),
    prisma.family.count(),
  ]);

  return { items: items as unknown as FamilyRecord[], total };
}

export async function listFamiliesByUserId(
  userId: string,
  params: { skip: number; take: number }
): Promise<ListFamiliesResult> {
  const { skip, take } = params;

  const where = { members: { some: { userId } } } as const;

  const [items, total] = await prisma.$transaction([
    prisma.family.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: familySelect,
    }),
    prisma.family.count({ where }),
  ]);

  return { items: items as unknown as FamilyRecord[], total };
}

export async function getFamilyById(id: string): Promise<FamilyRecord | null> {
  return prisma.family.findUnique({
    where: { id },
    select: familySelect,
  }) as Promise<FamilyRecord | null>;
}

export async function updateFamily(id: string, input: UpdateFamilyInput): Promise<FamilyRecord> {
  const updated = await prisma.family.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
    },
    select: familySelect,
  });

  return updated as unknown as FamilyRecord;
}

export async function deleteFamily(id: string): Promise<DeleteFamilyResult> {
  const deleted = await prisma.family.delete({
    where: { id },
    select: { id: true },
  });

  return deleted;
}

export default {
  createFamily,
  listFamilies,
  listFamiliesByUserId,
  getFamilyById,
  updateFamily,
  deleteFamily,
};
