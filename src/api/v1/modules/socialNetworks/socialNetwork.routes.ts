import { Router } from "express";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import authAdminMiddleware from "../../../../core/middlewares/authAdmin.middleware.js";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import { sendSuccess } from "../../../../utils/response.js";
import {
  listSocialNetworksController,
  createSocialNetworkController,
  updateSocialNetworkController,
  deleteSocialNetworkController,
} from "./socialNetwork.controller.js";

export const socialNetworkRoutes = Router();

socialNetworkRoutes.get(
  "/social-networks",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  listSocialNetworksController
);
socialNetworkRoutes.post(
  "/social-networks",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  createSocialNetworkController
);
socialNetworkRoutes.put(
  "/social-networks/:id",
  authRateLimiter,
  authMiddleware,
  updateSocialNetworkController
);
socialNetworkRoutes.delete(
  "/social-networks/:id",
  authRateLimiter,
  authMiddleware,
  deleteSocialNetworkController
);

socialNetworkRoutes.get('/social-network', authRateLimiter,
  (_req, res) => {
    const data = {};
    const message = "SocialNetwork Routes Ok";
    sendSuccess(res, data, message);
  }
);

export default socialNetworkRoutes;
