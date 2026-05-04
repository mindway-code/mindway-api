import { prisma } from "../prisma/client.js";
import type {
  ChildRecord,
  ChildWithAccessCodeRecord,
  CreateChildInput,
  DeleteChildResult,
  ListChildrenParams,
  ListChildrenResult,
  UpdateChildInput,
} from "../../../api/v1/modules/children/children.types.js";

const childSelect = {
  id: true,
  responsibleId: true,
  secondaryResponsibleId: true,
  name: true,
  age: true,
  birthDate: true,
  observation: true,
  createdAt: true,
  updatedAt: true,
} as const;

const childWithAccessCodeSelect = {
  ...childSelect,
  accessCode: true,
} as const;

export async function createChild(input: CreateChildInput): Promise<ChildWithAccessCodeRecord> {
  const created = await prisma.child.create({
    data: {
      responsibleId: input.responsibleId,
      secondaryResponsibleId: input.secondaryResponsibleId ?? null,
      name: input.name,
      age: input.age,
      birthDate: input.birthDate,
      observation: input.observation ?? null,
      accessCode: input.accessCode,
    },
    select: childWithAccessCodeSelect,
  });

  return created as unknown as ChildWithAccessCodeRecord;
}

export async function getChildById(id: string, opts?: { includeAccessCode?: boolean }): Promise<ChildRecord | ChildWithAccessCodeRecord | null> {
  const include = opts?.includeAccessCode ?? false;

  return prisma.child.findUnique({
    where: { id },
    select: include ? childWithAccessCodeSelect : childSelect,
  }) as any;
}

export async function getChildByAccessCode(accessCode: string): Promise<ChildRecord | null> {
  return prisma.child.findUnique({
    where: { accessCode },
    select: childSelect,
  }) as Promise<ChildRecord | null>;
}

export async function getChildIdByAccessCode(accessCode: string): Promise<{ id: string } | null> {
  return prisma.child.findUnique({
    where: { accessCode },
    select: { id: true },
  });
}

export async function listChildren(params: ListChildrenParams): Promise<ListChildrenResult> {
  const { skip, take, requesterUserId, isAdmin } = params;

  const where = isAdmin
    ? {}
    : {
        OR: [{ responsibleId: requesterUserId }, { secondaryResponsibleId: requesterUserId }],
      };

  const [items, total] = await prisma.$transaction([
    prisma.child.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: childWithAccessCodeSelect,
    }),
    prisma.child.count({ where }),
  ]);

  return { items: items as unknown as ChildWithAccessCodeRecord[], total };
}

export async function updateChild(id: string, input: UpdateChildInput): Promise<ChildWithAccessCodeRecord> {
  const updated = await prisma.child.update({
    where: { id },
    data: {
      ...(input.responsibleId !== undefined ? { responsibleId: input.responsibleId } : {}),
      ...(input.secondaryResponsibleId !== undefined ? { secondaryResponsibleId: input.secondaryResponsibleId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.age !== undefined ? { age: input.age } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.observation !== undefined ? { observation: input.observation } : {}),
    },
    select: childWithAccessCodeSelect,
  });

  return updated as unknown as ChildWithAccessCodeRecord;
}

export async function deleteChild(id: string): Promise<DeleteChildResult> {
  const deleted = await prisma.child.delete({
    where: { id },
    select: { id: true },
  });

  return deleted;
}

export default {
  createChild,
  getChildById,
  getChildByAccessCode,
  getChildIdByAccessCode,
  listChildren,
  updateChild,
  deleteChild,
};
