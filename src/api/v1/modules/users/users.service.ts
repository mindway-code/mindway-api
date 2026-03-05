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

export async function listUsersService(pageRaw: unknown, pageSizeRaw: unknown): Promise<ListUsersResponse> {
  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);

  const { items, total } = await listUsers({ skip, take });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    meta: { pagination: { page, pageSize, total, totalPages } },
  };
}

export async function getMeService(userId: string) {
  const me = await getMe(userId);
  if (!me) throw badRequest("User not found", 404);
  return me;
}


export async function createUserService(dto: UserDTO) {
  if (!dto.name?.trim()) throw badRequest("Name is required", 400);

  const passwordHash = dto.password ? await hashPassword(dto.password) : null;

  const input: UserDTO = {
    name: dto.name.trim(),
    email: dto.email ?? null,
    passwordHash,
    role: dto.role ? dto.role : 'common',
    provider: dto.provider ? dto.provider : "local",
  };

  const created = await createUser(input);
  return created;
}




export async function updateUserService(userId: string, dto: UpdateUserDTO) {

  const existing = await getMe(userId);
  if (!existing) throw badRequest("User not found", 404);

  const input: UpdateUserDTO = {
    ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
    ...(dto.email !== undefined ? { email: dto.email } : {}),
    ...(dto.role !== undefined ? { role: dto.role } : {}),
  };

  if (dto.password !== undefined && dto.password !==null) {
    input.passwordHash = await hashPassword(dto.password);
  }

  const updated = await updateUser(userId, input);
  return updated;
}


export async function deleteUserService(userId: string) {

  const existing = await getMe(userId);
  if (!existing) throw badRequest("User not found", 404);

  return deleteUser(userId);
}



export default {
  listUsersService,
  getMeService,
  createUserService,
  updateUserService,
  deleteUserService
};
