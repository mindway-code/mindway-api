import { pagination } from "../../../../utils/pagination.js";
import { badRequest, unauthorized } from "../../../../core/errors/httpError.js";
import { hashPassword, verifyPassword } from "../../../../utils/crypto/hash.js";

import {
  listUsers,
  getMe,
  getAuthById,
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
  getAuthById?: typeof getAuthById;
  createUser: typeof createUser;
  updateUser: typeof updateUser;
  deleteUser: typeof deleteUser;
  verifyPassword?: typeof verifyPassword;
  unauthorized?: typeof unauthorized;
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
    if ("password" in dto || "passwordHash" in dto) {
      throw deps.badRequest("Use the password change endpoint to update credentials");
    }

    const input: UpdateUserDTO = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
    };

    const updated = await deps.updateUser(userId, input);
    return updated;
  }

  async function changePasswordService(userId: string, currentPassword: string, newPassword: string) {
    if (!userId) throw deps.badRequest("User id is required");
    if (!currentPassword || !newPassword) throw deps.badRequest("Current and new passwords are required");
    const authUser = await (deps.getAuthById ?? getAuthById)(userId);
    if (!authUser) throw deps.badRequest("User not found");
    if (!authUser.passwordHash || !(await (deps.verifyPassword ?? verifyPassword)(currentPassword, authUser.passwordHash))) {
      throw (deps.unauthorized ?? unauthorized)("Current password is incorrect");
    }
    if (await (deps.verifyPassword ?? verifyPassword)(newPassword, authUser.passwordHash)) {
      throw deps.badRequest("New password must be different from the current password");
    }
    return deps.updateUser(userId, { passwordHash: await deps.hashPassword(newPassword) });
  }

  async function deleteUserService(userId: string) {
    const existing = await deps.getMe(userId);
    if (!existing) throw deps.badRequest("User not found", 404);

    return deps.deleteUser(userId);
  }

  return { listUsersService, getMeService, createUserService, updateUserService, changePasswordService, deleteUserService };
}

const defaultDeps: UsersServiceDeps = {
  pagination,
  badRequest,
  hashPassword,
  listUsers,
  getMe,
  getAuthById,
  createUser,
  updateUser,
  deleteUser,
  verifyPassword,
  unauthorized,
};

export const { listUsersService, getMeService, createUserService, updateUserService, changePasswordService, deleteUserService } =
  makeUsersServices(defaultDeps);

export default { listUsersService, getMeService, createUserService, updateUserService, changePasswordService, deleteUserService };
