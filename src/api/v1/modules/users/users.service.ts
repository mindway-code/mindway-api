import { pagination } from "../../../../utils/pagination.js";
import { badRequest } from "../../../../core/errors/httpError.js";
import { hashPassword } from "../../../../utils/crypto/hash.js";

import {
  listUsers,
  getMe,
  createUser,
  updateUser,
  deleteUser,
} from "../../../../infra/database/repositories/users.repository.js";

import type { UserDTO, UpdateUserDTO, ListUsersResponse } from "./users.types.js";

export type UsersServiceDeps = {
  pagination: typeof pagination;
  badRequest: typeof badRequest;
  hashPassword: typeof hashPassword;
  listUsers: typeof listUsers;
  getMe: typeof getMe;
  createUser: typeof createUser;
  updateUser: typeof updateUser;
  deleteUser: typeof deleteUser;
};

export function makeUsersServices(deps: UsersServiceDeps) {
  async function listUsersService(pageRaw: unknown, pageSizeRaw: unknown): Promise<ListUsersResponse> {
    const { page, pageSize, skip, take } = deps.pagination(pageRaw, pageSizeRaw);

    const { items, total } = await deps.listUsers({ skip, take });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items,
      meta: { pagination: { page, pageSize, total, totalPages } },
    };
  }

  async function getMeService(userId: string) {
    const me = await deps.getMe(userId);
    if (!me) throw deps.badRequest("User not found", 404);
    return me;
  }

  async function createUserService(dto: UserDTO) {
    if (!dto.name?.trim()) throw deps.badRequest("Name is required", 400);

    const passwordHash = dto.password ? await deps.hashPassword(dto.password) : null;

    const input: UserDTO = {
      name: dto.name.trim(),
      email: dto.email ?? null,
      passwordHash,
      role: dto.role ? dto.role : "common",
      provider: dto.provider ? dto.provider : "local",
    };

    const created = await deps.createUser(input);
    return created;
  }

  async function updateUserService(userId: string, dto: UpdateUserDTO) {
    const existing = await deps.getMe(userId);
    if (!existing) throw deps.badRequest("User not found", 404);

    const input: UpdateUserDTO = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
    };

    if (dto.password !== undefined && dto.password !== null) {
      input.passwordHash = await deps.hashPassword(dto.password);
    }

    const updated = await deps.updateUser(userId, input);
    return updated;
  }

  async function deleteUserService(userId: string) {
    const existing = await deps.getMe(userId);
    if (!existing) throw deps.badRequest("User not found", 404);

    return deps.deleteUser(userId);
  }

  return { listUsersService, getMeService, createUserService, updateUserService, deleteUserService };
}

const defaultDeps: UsersServiceDeps = {
  pagination,
  badRequest,
  hashPassword,
  listUsers,
  getMe,
  createUser,
  updateUser,
  deleteUser,
};

export const { listUsersService, getMeService, createUserService, updateUserService, deleteUserService } =
  makeUsersServices(defaultDeps);

export default { listUsersService, getMeService, createUserService, updateUserService, deleteUserService };
