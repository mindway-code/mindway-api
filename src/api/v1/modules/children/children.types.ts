export type ChildRecord = {
  id: string;
  responsibleId: string;
  secondaryResponsibleId: string | null;
  name: string;
  age: number;
  birthDate: Date;
  observation: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ChildWithAccessCodeRecord = ChildRecord & {
  accessCode: string;
};

export type CreateChildDTO = {
  responsibleId?: string;
  secondaryResponsibleId?: string | null;
  name: string;
  age: number;
  birthDate: string | Date;
  observation?: string | null;
};

export type UpdateChildDTO = {
  secondaryResponsibleId?: string | null;
  name?: string;
  age?: number;
  birthDate?: string | Date;
  observation?: string | null;
};

export type CreateChildInput = {
  responsibleId: string;
  secondaryResponsibleId?: string | null;
  name: string;
  age: number;
  birthDate: Date;
  observation?: string | null;
  accessCode: string;
};

export type UpdateChildInput = {
  responsibleId?: string;
  secondaryResponsibleId?: string | null;
  name?: string;
  age?: number;
  birthDate?: Date;
  observation?: string | null;
};

export type DeleteChildResult = { id: string };

export type ListChildrenResult = {
  items: ChildWithAccessCodeRecord[];
  total: number;
};

export type ListChildrenParams = {
  skip: number;
  take: number;
  requesterUserId: string;
  isAdmin: boolean;
};

export type ListChildrenResponse = {
  items: unknown[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};

export type ValidateAccessCodeDTO = {
  accessCode: string;
};
