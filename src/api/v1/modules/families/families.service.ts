import { pagination } from "../../../../utils/pagination.js";
import { badRequest } from "../../../../core/errors/httpError.js";
import {
  createFamily,
  listFamilies,
  getFamilyById,
  updateFamily,
  deleteFamily,
} from "../../../../infra/database/repositories/families.repository.js";

import type { ListFamiliesResponse, CreateFamilyDTO, UpdateFamilyDTO, CreateFamilyInput, UpdateFamilyInput } from "./families.types.js";

export async function listFamiliesService(pageRaw: unknown, pageSizeRaw: unknown): Promise<ListFamiliesResponse> {
  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);

  const { items, total } = await listFamilies({ skip, take });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    meta: { pagination: { page, pageSize, total, totalPages } },
  };
}

export async function createFamilyService(dto: CreateFamilyDTO) {
  const name = dto.name?.trim();
  if (!name) throw badRequest("Name is required", 400);

  const input: CreateFamilyInput = { name };
  return createFamily(input);
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

  return updateFamily(id, input);
}

export async function deleteFamilyService(id: string) {
  if (!id) throw badRequest("Family id is required", 400);

  const existing = await getFamilyById(id);
  if (!existing) throw badRequest("Family not found", 404);

  return deleteFamily(id);
}

export default {
  listFamiliesService,
  createFamilyService,
  getFamilyByIdService,
  updateFamilyService,
  deleteFamilyService,
};
