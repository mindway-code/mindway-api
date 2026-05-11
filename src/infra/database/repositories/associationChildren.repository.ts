import { prisma } from "../prisma/client.js";
import type { AssociationChildRecord } from "../../../api/v1/modules/associationChildren/associationChildren.types.js";

const associationChildSelect = {
  id: true,
  userId: true,
  childId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function findAssociationByUserAndChild(
  userId: string,
  childId: string
): Promise<AssociationChildRecord | null> {
  return prisma.associationChild.findFirst({
    where: { userId, childId },
    select: associationChildSelect,
  }) as Promise<AssociationChildRecord | null>;
}

export async function createAssociationChild(userId: string, childId: string): Promise<AssociationChildRecord> {
  const created = await prisma.associationChild.create({
    data: { userId, childId },
    select: associationChildSelect,
  });

  return created as unknown as AssociationChildRecord;
}

export default { findAssociationByUserAndChild, createAssociationChild };

