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
import authTherapistmiddleware from "../../../../core/middlewares/authTherapist.middleware.js";

export const socialNetworkRoutes = Router();

socialNetworkRoutes.get(
  "/social-networks",
  authRateLimiter,
  authMiddleware,
  authTherapistmiddleware,
  listSocialNetworksController
);
socialNetworkRoutes.post(
  "/social-networks",
  authRateLimiter,
  authMiddleware,
  authTherapistmiddleware,
  createSocialNetworkController
);
socialNetworkRoutes.put(
  "/social-networks/:id",
  authRateLimiter,
  authMiddleware,
  authTherapistmiddleware,
  updateSocialNetworkController
);
socialNetworkRoutes.delete(
  "/social-networks/:id",
  authRateLimiter,
  authMiddleware,
  authTherapistmiddleware,
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
