export type FamilyRecord = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateFamilyInput = {
  name: string;
};

export type ListFamiliesResult = {
  items: FamilyRecord[];
  total: number;
};

export type UpdateFamilyInput = {
  name?: string;
};

export type DeleteFamilyResult = {
  id: string;
};

export type CreateFamilyDTO = {
  name: string;
};

export type UpdateFamilyDTO = {
  name?: string;
};

export type ListFamiliesResponse = {
  items: unknown[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};
