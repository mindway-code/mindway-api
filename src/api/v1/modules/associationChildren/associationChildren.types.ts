import type { ChildWithAccessCodeRecord } from "../children/children.types.js";

export type CreateAssociationChildDTO = {
  accessCode: string;
};

export type AssociationChildRecord = {
  id: string;
  userId: string;
  childId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AssociateChildResult = {
  child: ChildWithAccessCodeRecord;
  association: AssociationChildRecord | null;
  alreadyHadAccess: boolean;
};

