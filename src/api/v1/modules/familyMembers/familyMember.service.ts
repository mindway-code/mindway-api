import { pagination } from "../../../../utils/pagination.js";
import { buildCacheKey, getOrSetCached, invalidateCachePatterns } from "../../../../utils/cache.js";
import { badRequest } from "../../../../core/errors/httpError.js";
import {
	createFamilyMember,
	listFamilyMembers,
	getFamilyMemberById,
	updateFamilyMember,
	deleteFamilyMember,
} from "../../../../infra/database/repositories/familyMembers.repository.js";

import type {
	ListFamilyMembersResponse,
	CreateFamilyMemberDTO,
	UpdateFamilyMemberDTO,
} from "./familyMember.types.js";

const FAMILY_MEMBERS_CACHE_TTL_SECONDS = 300;
const FAMILY_MEMBERS_CACHE_PATTERNS = ["family-members:list:*", "families:list:*", "families:mine:*"];

async function invalidateFamilyMembersCache() {
	await invalidateCachePatterns(FAMILY_MEMBERS_CACHE_PATTERNS);
}

export async function listFamilyMembersService(
	pageRaw: unknown,
	pageSizeRaw: unknown,
	familyIdRaw?: unknown,
	userIdRaw?: unknown
): Promise<ListFamilyMembersResponse> {
	const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);

	const params: any = { skip, take };
	if (typeof familyIdRaw === "string" && familyIdRaw) params.familyId = familyIdRaw;
	if (typeof userIdRaw === "string" && userIdRaw) params.userId = userIdRaw;
	const familyId = typeof familyIdRaw === "string" && familyIdRaw ? familyIdRaw : "all";
	const userId = typeof userIdRaw === "string" && userIdRaw ? userIdRaw : "all";
	const cacheKey = buildCacheKey("family-members:list", [
		["familyId", familyId],
		["userId", userId],
		["page", page],
		["pageSize", pageSize],
	]);

	return getOrSetCached({
		key: cacheKey,
		ttlSeconds: FAMILY_MEMBERS_CACHE_TTL_SECONDS,
		load: async () => {
			const { items, total } = await listFamilyMembers(params);
			const totalPages = Math.max(1, Math.ceil(total / pageSize));

			return {
				items,
				meta: { pagination: { page, pageSize, total, totalPages } },
			} as unknown as ListFamilyMembersResponse;
		},
	});
}

export async function createFamilyMemberService(dto: CreateFamilyMemberDTO) {
	const userId = dto.userId?.trim?.() ?? "";
	const familyId = dto.familyId?.trim?.() ?? "";
	const role = dto.role;

	if (!userId) throw badRequest("User id is required", 400);
	if (!familyId) throw badRequest("Family id is required", 400);
	if (!role) throw badRequest("Role is required", 400);

	const input = { userId, familyId, role } as CreateFamilyMemberDTO;
	const created = await createFamilyMember(input);
	await invalidateFamilyMembersCache();

	return created;
}

export async function getFamilyMemberByIdService(id: string) {
	if (!id) throw badRequest("FamilyMember id is required", 400);

	const fm = await getFamilyMemberById(id);
	if (!fm) throw badRequest("FamilyMember not found", 404);

	return fm;
}

export async function updateFamilyMemberService(id: string, dto: UpdateFamilyMemberDTO) {
	if (!id) throw badRequest("FamilyMember id is required", 400);

	const existing = await getFamilyMemberById(id);
	if (!existing) throw badRequest("FamilyMember not found", 404);

	const input: UpdateFamilyMemberDTO = {
		...(dto.userId !== undefined ? { userId: dto.userId?.trim?.() } : {}),
		...(dto.familyId !== undefined ? { familyId: dto.familyId?.trim?.() } : {}),
		...(dto.role !== undefined ? { role: dto.role } : {}),
	};

	const updated = await updateFamilyMember(id, input);
	await invalidateFamilyMembersCache();

	return updated;
}

export async function deleteFamilyMemberService(id: string) {
	if (!id) throw badRequest("FamilyMember id is required", 400);

	const existing = await getFamilyMemberById(id);
	if (!existing) throw badRequest("FamilyMember not found", 404);

	const deleted = await deleteFamilyMember(id);
	await invalidateFamilyMembersCache();

	return deleted;
}

export default {
	listFamilyMembersService,
	createFamilyMemberService,
	getFamilyMemberByIdService,
	updateFamilyMemberService,
	deleteFamilyMemberService,
};
