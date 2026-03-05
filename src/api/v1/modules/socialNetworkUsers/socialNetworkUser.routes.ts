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
  authAdminMiddleware,
  createSocialNetworkUserController
);
socialNetworkUserRoutes.get(
  "/social-network-users/:id",
  authRateLimiter,
  authMiddleware,
  getSocialNetworkUserByIdController
);
socialNetworkUserRoutes.put(
  "/social-network-users/:id",
  authRateLimiter,
  authMiddleware,
  updateSocialNetworkUserController
);
socialNetworkUserRoutes.delete(
  "/social-network-users/:id",
  authRateLimiter,
  authMiddleware,
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
