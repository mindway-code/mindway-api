import { pagination } from "../../../../utils/pagination.js";
import {
  badRequest,
  passwordReauthenticationUnsupported,
  unauthorized,
} from "../../../../core/errors/httpError.js";
import { hashPassword, verifyPassword } from "../../../../utils/crypto/hash.js";
import {
  changePasswordAndRevokeRefreshTokens,
  findAuthUserByIdForPassword,
} from "../../../../infra/database/repositories/auth.repository.js";

import {
  listUsers,
  getMe,
  createUser,
  updateUser,
  deleteUser,
} from "../../../../infra/database/repositories/users.repository.js";

import type { ChangeMyPasswordDTO, UserDTO, UpdateUserDTO, ListUsersResponse } from "./users.types.js";

export type UsersServiceDeps = {
  pagination: typeof pagination;
  badRequest: typeof badRequest;
  unauthorized: typeof unauthorized;
  passwordReauthenticationUnsupported: typeof passwordReauthenticationUnsupported;
  hashPassword: typeof hashPassword;
  verifyPassword: typeof verifyPassword;
  listUsers: typeof listUsers;
  getMe: typeof getMe;
  createUser: typeof createUser;
  updateUser: typeof updateUser;
  deleteUser: typeof deleteUser;
  findAuthUserByIdForPassword: typeof findAuthUserByIdForPassword;
  changePasswordAndRevokeRefreshTokens: typeof changePasswordAndRevokeRefreshTokens;
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
    };

    const updated = await deps.updateUser(userId, input);
    return updated;
  }

  async function changeMyPasswordService(userId: string, dto: ChangeMyPasswordDTO): Promise<void> {
    const user = await deps.findAuthUserByIdForPassword(userId);
    if (!user) throw deps.unauthorized("Authentication failed");

    if (user.provider === "google" || !user.passwordHash) {
      throw deps.passwordReauthenticationUnsupported();
    }

    const matches = await deps.verifyPassword(dto.currentPassword, user.passwordHash);
    if (!matches) throw deps.unauthorized("Authentication failed");

    const passwordHash = await deps.hashPassword(dto.newPassword);
    await deps.changePasswordAndRevokeRefreshTokens(userId, passwordHash);
  }

  async function deleteUserService(userId: string) {
    const existing = await deps.getMe(userId);
    if (!existing) throw deps.badRequest("User not found", 404);

    return deps.deleteUser(userId);
  }

  return {
    listUsersService,
    getMeService,
    createUserService,
    updateUserService,
    changeMyPasswordService,
    deleteUserService,
  };
}

const defaultDeps: UsersServiceDeps = {
  pagination,
  badRequest,
  unauthorized,
  passwordReauthenticationUnsupported,
  hashPassword,
  verifyPassword,
  listUsers,
  getMe,
  createUser,
  updateUser,
  deleteUser,
  findAuthUserByIdForPassword,
  changePasswordAndRevokeRefreshTokens,
};

export const { listUsersService, getMeService, createUserService, updateUserService, changeMyPasswordService, deleteUserService } =
  makeUsersServices(defaultDeps);

export default { listUsersService, getMeService, createUserService, updateUserService, changeMyPasswordService, deleteUserService };
