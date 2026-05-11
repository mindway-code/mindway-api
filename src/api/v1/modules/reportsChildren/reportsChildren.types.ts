import type { UserRole } from "../../../../utils/crypto/jwt.js";

export type ReportsChildRecord = {
  id: string;
  childId: string;
  userId: string;
  userRole: UserRole;
  title: string;
  behavior: string | null;
  difficulty: string | null;
  recommendation: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateReportsChildDTO = {
  title: string;
  behavior?: string | null;
  difficulty?: string | null;
  recommendation?: string | null;
  accessCode?: string;
};

export type UpdateReportsChildDTO = {
  title?: string;
  behavior?: string | null;
  difficulty?: string | null;
  recommendation?: string | null;
};

export type CreateReportsChildInput = {
  childId: string;
  userId: string;
  userRole: UserRole;
  title: string;
  behavior: string | null;
  difficulty: string | null;
  recommendation: string | null;
};

export type UpdateReportsChildInput = {
  title?: string;
  behavior?: string | null;
  difficulty?: string | null;
  recommendation?: string | null;
};

export type DeleteReportsChildResult = { id: string };

export type ListReportsChildrenParams = {
  skip?: number;
  take?: number;
};

export type ListReportsChildrenResult = {
  items: ReportsChildRecord[];
  total: number;
};

export type ListReportsChildrenResponse = {
  items: ReportsChildRecord[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};

