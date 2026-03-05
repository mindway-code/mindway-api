import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../../utils/response.js";
import {
	listFamilyMembersService,
	createFamilyMemberService,
	getFamilyMemberByIdService,
	updateFamilyMemberService,
	deleteFamilyMemberService,
} from "./familyMember.service.js";
import { FamilyMemberRole } from "./familyMember.types.js";

export async function listFamilyMembersController(req: Request, res: Response) {
	try {
		const { page, pageSize, familyId, userId } = req.query;
		const result = await listFamilyMembersService(page, pageSize, familyId, userId);

		return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
	} catch (err) {
		return sendError(res, err);
	}
}

export async function createFamilyMemberController(req: Request, res: Response) {
	try {
		const { userId, familyId, role } = req.body as { userId?: string; familyId?: string; role?: string };
		const created = await createFamilyMemberService({ userId: userId ?? "", familyId: familyId ?? "", role: role as any });

		return sendSuccess(res, created, "FamilyMember created");
	} catch (err) {
		return sendError(res, err);
	}
}

export async function getFamilyMemberByIdController(req: Request, res: Response) {
	try {
		const { id } = req.params as { id: string };
		const fm = await getFamilyMemberByIdService(id);

		return sendSuccess(res, fm);
	} catch (err) {
		return sendError(res, err);
	}
}

export async function updateFamilyMemberController(req: Request, res: Response) {
	try {
		const { id } = req.params as { id: string };
		const { userId, familyId, role } = req.body as { userId: string; familyId: string; role: FamilyMemberRole };

		const updated = await updateFamilyMemberService(id, { userId, familyId, role: role });

		return sendSuccess(res, updated, "FamilyMember updated");
	} catch (err) {
		return sendError(res, err);
	}
}

export async function deleteFamilyMemberController(req: Request, res: Response) {
	try {
		const { id } = req.params as { id: string };
		const deleted = await deleteFamilyMemberService(id);

		return sendSuccess(res, deleted, "FamilyMember deleted");
	} catch (err) {
		return sendError(res, err);
	}
}

export default {
	listFamilyMembersController,
	createFamilyMemberController,
	getFamilyMemberByIdController,
	updateFamilyMemberController,
	deleteFamilyMemberController,
};

