import type { UserRole } from "../../../../utils/crypto/jwt.js";

export type UserRecord = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: UserRole | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type UserAuthRecord = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  passwordHash: string | null;
};

export type UserDTO = {
  name: string;
  email?: string | null;
  password?: string | null;
  passwordHash?: string | null;
  role: UserRole;
  provider?: "local" | "google";
  googleId?: string;
};

export type UpdateUserDTO = {
  name?: string;
  email?: string | null;
  password?: string;
  passwordHash?: string;
  role?: UserRole;
  provider?: "local" | "google";
  googleId?: string;
};

export type DeleteUserResult = { id: string };

export type ListUsersResult = {
  items: UserRecord[];
  total: number;
};

export type PaginationMeta = {
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export type ListUsersResponse = {
  items: unknown[];
  meta: PaginationMeta;
};
