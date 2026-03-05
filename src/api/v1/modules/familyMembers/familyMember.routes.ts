import { Router } from "express";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import authAdminMiddleware from "../../../../core/middlewares/authAdmin.middleware.js";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import {
	listFamilyMembersController,
	createFamilyMemberController,
	getFamilyMemberByIdController,
	updateFamilyMemberController,
	deleteFamilyMemberController,
} from "./familyMember.controller.js";
import { sendSuccess } from "../../../../utils/response.js";

export const familyMemberRoutes = Router();

familyMemberRoutes.get(
	"/family-members",
	authRateLimiter,
	authMiddleware,
	authAdminMiddleware,
	listFamilyMembersController
);
familyMemberRoutes.post(
	"/family-members",
	authRateLimiter,
	authMiddleware,
	authAdminMiddleware,
	createFamilyMemberController
);
familyMemberRoutes.get(
	"/family-members/:id",
	authRateLimiter,
	authMiddleware,
	getFamilyMemberByIdController
);
familyMemberRoutes.put(
	"/family-members/:id",
	authRateLimiter,
	authMiddleware,
	updateFamilyMemberController
);
familyMemberRoutes.delete(
	"/family-members/:id",
	authRateLimiter,
	authMiddleware,
	deleteFamilyMemberController
);

familyMemberRoutes.get(
	"/family-member",
	authRateLimiter,
	(_req, res) => {
		const data = {};
		const message = "FamilyMember Routes Ok";
		sendSuccess(res, data, message);
	}
);

export default familyMemberRoutes;

