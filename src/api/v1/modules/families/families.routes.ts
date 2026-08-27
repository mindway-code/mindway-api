import { Router } from "express";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import authAdminMiddleware from "../../../../core/middlewares/authAdmin.middleware.js";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import {
  createFamilyController,
  deleteFamilyController,
  listFamiliesController,
  listMyFamiliesController,
  updateFamilyController,
} from "./families.controller.js";
import { sendSuccess } from "../../../../utils/response.js";

export const familyRoutes = Router();

familyRoutes.get(
  "/families/me",
  authRateLimiter,
  authMiddleware,
  listMyFamiliesController
);

familyRoutes.get(
  "/families",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  listFamiliesController
);
familyRoutes.post(
  "/families",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  createFamilyController
);
familyRoutes.put(
  "/families/me",
  authRateLimiter,
  authMiddleware,
  updateFamilyController
);
familyRoutes.delete(
  "/families/me",
  authRateLimiter,
  authMiddleware,
  deleteFamilyController
);

familyRoutes.get('/family', authRateLimiter,
  (_req, res) => {
    const data = {};
    const message = "Family Routes Ok";
    sendSuccess(res, data, message);
  }
);

export default familyRoutes;
