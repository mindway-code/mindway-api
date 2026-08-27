import { pagination } from "../../../../utils/pagination.js";
import { badRequest } from "../../../../core/errors/httpError.js";
import {
  createSocialNetwork,
  listSocialNetworks,
  updateSocialNetwork,
  deleteSocialNetwork,
} from "../../../../infra/database/repositories/socialNetworks.repository.js";

import type {
  CreateSocialNetworkDTO,
  UpdateSocialNetworkDTO,
  ListSocialNetworksResponse,
  CreateSocialNetworkInput,
  UpdateSocialNetworkInput,
} from "./socialNetwork.types.js";

export async function listSocialNetworksService(pageRaw: unknown, pageSizeRaw: unknown): Promise<ListSocialNetworksResponse> {
  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);

  const { items, total } = await listSocialNetworks({ skip, take });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
}

export async function createSocialNetworkService(dto: CreateSocialNetworkDTO) {
  const name = dto.name?.trim();
  if (!name) throw badRequest("name is required", 400);

  const input: CreateSocialNetworkInput = { name, description: dto.description ?? null };
  return createSocialNetwork(input);
}

export async function updateSocialNetworkService(id: string, dto: UpdateSocialNetworkDTO) {
  if (!id) throw badRequest("SocialNetwork id is required", 400);

  const input: UpdateSocialNetworkInput = {
    ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
    ...(dto.description !== undefined ? { description: dto.description } : {}),
  };

  if (dto.name !== undefined && !input.name) throw badRequest("name cannot be empty", 400);

  return updateSocialNetwork(id, input);
}

export async function deleteSocialNetworkService(id: string) {
  if (!id) throw badRequest("SocialNetwork id is required", 400);
  return deleteSocialNetwork(id);
}

export default {
  listSocialNetworksService,
  createSocialNetworkService,
  updateSocialNetworkService,
  deleteSocialNetworkService,
};
