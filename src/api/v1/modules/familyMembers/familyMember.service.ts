import { pagination } from "../../../../utils/pagination.js";
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

	const { items, total } = await listFamilyMembers(params);

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return {
		items,
		meta: { pagination: { page, pageSize, total, totalPages } },
	} as unknown as ListFamilyMembersResponse;
}

export async function createFamilyMemberService(dto: CreateFamilyMemberDTO) {
	const userId = dto.userId?.trim?.() ?? "";
	const familyId = dto.familyId?.trim?.() ?? "";
	const role = dto.role;

	if (!userId) throw badRequest("User id is required", 400);
	if (!familyId) throw badRequest("Family id is required", 400);
	if (!role) throw badRequest("Role is required", 400);

	const input = { userId, familyId, role } as CreateFamilyMemberDTO;
	return createFamilyMember(input);
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

	return updateFamilyMember(id, input);
}

export async function deleteFamilyMemberService(id: string) {
	if (!id) throw badRequest("FamilyMember id is required", 400);

	const existing = await getFamilyMemberById(id);
	if (!existing) throw badRequest("FamilyMember not found", 404);

	return deleteFamilyMember(id);
}

export default {
	listFamilyMembersService,
	createFamilyMemberService,
	getFamilyMemberByIdService,
	updateFamilyMemberService,
	deleteFamilyMemberService,
};
