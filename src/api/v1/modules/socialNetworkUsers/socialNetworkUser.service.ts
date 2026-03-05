import { pagination } from "../../../../utils/pagination.js";
import { badRequest } from "../../../../core/errors/httpError.js";
import {
  createSocialNetworkUser,
  listSocialNetworkUsers,
  getSocialNetworkUserById,
  updateSocialNetworkUser,
  deleteSocialNetworkUser,
} from "../../../../infra/database/repositories/socialNetworkUsers.repository.js";

import type {
  CreateSocialNetworkUserDTO,
  UpdateSocialNetworkUserDTO,
  ListSocialNetworkUsersResponse,
  CreateSocialNetworkUserInput,
  UpdateSocialNetworkUserInput,
} from "./socialNetworkUser.types.js";

export async function listSocialNetworkUsersService(
  pageRaw: unknown,
  pageSizeRaw: unknown,
  socialNetworkIdRaw?: unknown,
  userIdRaw?: unknown
): Promise<ListSocialNetworkUsersResponse> {
  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);

  const params: any = { skip, take };
  if (typeof socialNetworkIdRaw === "string" && socialNetworkIdRaw) params.socialNetworkId = socialNetworkIdRaw;
  if (typeof userIdRaw === "string" && userIdRaw) params.userId = userIdRaw;

  const { items, total } = await listSocialNetworkUsers(params);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items, meta: { pagination: { page, pageSize, total, totalPages } } } as unknown as ListSocialNetworkUsersResponse;
}

export async function createSocialNetworkUserService(dto: CreateSocialNetworkUserDTO) {
  const socialNetworkId = dto.socialNetworkId?.trim?.() ?? "";
  const userId = dto.userId?.trim?.() ?? "";

  if (!socialNetworkId) throw badRequest("socialNetworkId is required", 400);
  if (!userId) throw badRequest("userId is required", 400);

  const input: CreateSocialNetworkUserInput = { socialNetworkId, userId };
  return createSocialNetworkUser(input);
}

export async function getSocialNetworkUserByIdService(id: string) {
  if (!id) throw badRequest("SocialNetworkUser id is required", 400);

  const item = await getSocialNetworkUserById(id);
  if (!item) throw badRequest("SocialNetworkUser not found", 404);

  return item;
}

export async function updateSocialNetworkUserService(id: string, dto: UpdateSocialNetworkUserDTO) {
  if (!id) throw badRequest("SocialNetworkUser id is required", 400);

  const existing = await getSocialNetworkUserById(id);
  if (!existing) throw badRequest("SocialNetworkUser not found", 404);

  const input: UpdateSocialNetworkUserInput = {
    ...(dto.socialNetworkId !== undefined ? { socialNetworkId: dto.socialNetworkId?.trim?.() } : {}),
    ...(dto.userId !== undefined ? { userId: dto.userId?.trim?.() } : {}),
  };

  return updateSocialNetworkUser(id, input);
}

export async function deleteSocialNetworkUserService(id: string) {
  if (!id) throw badRequest("SocialNetworkUser id is required", 400);
  return deleteSocialNetworkUser(id);
}

export default {
  listSocialNetworkUsersService,
  createSocialNetworkUserService,
  getSocialNetworkUserByIdService,
  updateSocialNetworkUserService,
  deleteSocialNetworkUserService,
};
