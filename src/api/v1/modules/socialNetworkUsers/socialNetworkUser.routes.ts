import { Router } from "express";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import authAdminMiddleware from "../../../../core/middlewares/authAdmin.middleware.js";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import { sendSuccess } from "../../../../utils/response.js";
import {
  listSocialNetworkUsersController,
  createSocialNetworkUserController,
  getSocialNetworkUserByIdController,
  updateSocialNetworkUserController,
  deleteSocialNetworkUserController,
} from "./socialNetworkUser.controller.js";
import { authTherapistmiddleware } from "../../../../core/middlewares/authTherapist.middleware.js";

export const socialNetworkUserRoutes = Router();

socialNetworkUserRoutes.get(
  "/social-network-users",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  listSocialNetworkUsersController
);
socialNetworkUserRoutes.post(
  "/social-network-users",
  authRateLimiter,
  authMiddleware,
  authTherapistmiddleware,
  createSocialNetworkUserController
);
socialNetworkUserRoutes.get(
  "/social-network-users/:id",
  authRateLimiter,
  authMiddleware,
  authTherapistmiddleware,
  getSocialNetworkUserByIdController
);
socialNetworkUserRoutes.put(
  "/social-network-users/:id",
  authRateLimiter,
  authMiddleware,
  authTherapistmiddleware,
  updateSocialNetworkUserController
);
socialNetworkUserRoutes.delete(
  "/social-network-users/:id",
  authRateLimiter,
  authMiddleware,
  authTherapistmiddleware,
  deleteSocialNetworkUserController
);

socialNetworkUserRoutes.get('/social-network-user', authRateLimiter,
  (_req, res) => {
    const data = {};
    const message = "SocialNetworkUser Routes Ok";
    sendSuccess(res, data, message);
  }
);

export default socialNetworkUserRoutes;
