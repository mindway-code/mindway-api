import { prisma } from "../prisma/client.js";
import {
  FamilyMember,
  CreateFamilyMemberDTO,
  ListFamilyMembersParams,
  ListFamilyMembersResponse,
  UpdateFamilyMemberDTO,
  DeleteFamilyMemberResponse,
  ListFamilyMembersResult,
} from "../../../api/v1/modules/familyMembers/familyMember.types.js";

const familyMemberSelect = {
  id: true,
  userId: true,
  familyId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
  family: { select: { id: true, name: true } },
} as const;

export async function createFamilyMember(
  input: CreateFamilyMemberDTO
): Promise<FamilyMember> {
  const created = await prisma.familyMember.create({
    data: {
      userId: input.userId,
      familyId: input.familyId,
      role: input.role,
    },
    select: familyMemberSelect,
  });

  return created as unknown as FamilyMember;
}

export async function listFamilyMembers(
  params: ListFamilyMembersParams = {}
): Promise<ListFamilyMembersResult> {
  const { familyId, userId, skip = 0, take = 20 } = params;

  const where: any = {};
  if (familyId) where.familyId = familyId;
  if (userId) where.userId = userId;

  const [items, total] = await prisma.$transaction([
    prisma.familyMember.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: familyMemberSelect,
    }),
    prisma.familyMember.count({ where }),
  ]);

  return { items: items as unknown as FamilyMember[], total };
}

export async function getFamilyMemberById(id: string): Promise<FamilyMember | null> {
  return prisma.familyMember.findUnique({
    where: { id },
    select: familyMemberSelect,
  }) as Promise<FamilyMember | null>;
}

export async function updateFamilyMember(
  id: string,
  input: UpdateFamilyMemberDTO
): Promise<FamilyMember> {
  const updated = await prisma.familyMember.update({
    where: { id },
    data: {
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      ...(input.familyId !== undefined ? { familyId: input.familyId } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
    },
    select: familyMemberSelect,
  });

  return updated as unknown as FamilyMember;
}

export async function deleteFamilyMember(id: string): Promise<DeleteFamilyMemberResponse> {
  const deleted = await prisma.familyMember.delete({
    where: { id },
    select: { id: true },
  });

  return deleted as DeleteFamilyMemberResponse;
}

export default {
  createFamilyMember,
  listFamilyMembers,
  getFamilyMemberById,
  updateFamilyMember,
  deleteFamilyMember,
};
