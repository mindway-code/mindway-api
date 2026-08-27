import { pagination } from "../../../../utils/pagination.js";
import { buildCacheKey, getOrSetCached, invalidateCachePatterns } from "../../../../utils/cache.js";
import { badRequest } from "../../../../core/errors/httpError.js";
import {
  createFamily,
  listFamilies,
  listFamiliesByUserId,
  getFamilyById,
  updateFamily,
  deleteFamily,
} from "../../../../infra/database/repositories/families.repository.js";

import type {
  ListFamiliesResponse,
  ListMyFamiliesResponse,
  CreateFamilyDTO,
  UpdateFamilyDTO,
  CreateFamilyInput,
  UpdateFamilyInput,
} from "./families.types.js";

const FAMILIES_CACHE_TTL_SECONDS = 300;
const FAMILIES_CACHE_PATTERNS = ["families:list:*", "families:mine:*"];

async function invalidateFamiliesCache() {
  await invalidateCachePatterns(FAMILIES_CACHE_PATTERNS);
}

export async function listFamiliesService(pageRaw: unknown, pageSizeRaw: unknown): Promise<ListFamiliesResponse> {
  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);
  const cacheKey = buildCacheKey("families:list", [
    ["page", page],
    ["pageSize", pageSize],
  ]);

  return getOrSetCached({
    key: cacheKey,
    ttlSeconds: FAMILIES_CACHE_TTL_SECONDS,
    load: async () => {
      const { items, total } = await listFamilies({ skip, take });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return {
        items,
        meta: { pagination: { page, pageSize, total, totalPages } },
      };
    },
  });
}

export async function listMyFamiliesService(userId: string, pageRaw: unknown, pageSizeRaw: unknown): Promise<ListMyFamiliesResponse> {
  if (!userId) throw badRequest("userId is required", 400);

  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);
  const cacheKey = buildCacheKey("families:mine", [
    ["userId", userId],
    ["page", page],
    ["pageSize", pageSize],
  ]);

  return getOrSetCached({
    key: cacheKey,
    ttlSeconds: FAMILIES_CACHE_TTL_SECONDS,
    load: async () => {
      const { items, total } = await listFamiliesByUserId(userId, { skip, take });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return {
        items,
        meta: { pagination: { page, pageSize, total, totalPages } },
      };
    },
  });
}

export async function createFamilyService(dto: CreateFamilyDTO) {
  const name = dto.name?.trim();
  if (!name) throw badRequest("Name is required", 400);

  const input: CreateFamilyInput = { name };
  const created = await createFamily(input);
  await invalidateFamiliesCache();

  return created;
}

export async function getFamilyByIdService(id: string) {
  if (!id) throw badRequest("Family id is required", 400);

  const family = await getFamilyById(id);
  if (!family) throw badRequest("Family not found", 404);

  return family;
}

export async function updateFamilyService(id: string, dto: UpdateFamilyDTO) {
  if (!id) throw badRequest("Family id is required", 400);


  const existing = await getFamilyById(id);
  if (!existing) throw badRequest("Family not found", 404);

  const input: UpdateFamilyInput = {
    ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
  };

  if (dto.name !== undefined && !input.name) {
    throw badRequest("Name cannot be empty", 400);
  }

  const updated = await updateFamily(id, input);
  await invalidateFamiliesCache();

  return updated;
}

export async function deleteFamilyService(id: string) {
  if (!id) throw badRequest("Family id is required", 400);

  const existing = await getFamilyById(id);
  if (!existing) throw badRequest("Family not found", 404);

  const deleted = await deleteFamily(id);
  await invalidateFamiliesCache();

  return deleted;
}

export default {
  listFamiliesService,
  listMyFamiliesService,
  createFamilyService,
  getFamilyByIdService,
  updateFamilyService,
  deleteFamilyService,
};
