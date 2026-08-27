import { Router } from "express";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import {
  createDirectMessageController,
  createSocialNetworkMessageController,
  deleteMessageController,
  listDirectMessagesController,
  listSocialNetworkMessagesController,
  messagesOkController,
} from "./messages.controller.js";

export const messagesRoutes = Router();

messagesRoutes.get("/messages", authRateLimiter, messagesOkController);

messagesRoutes.get("/messages/dm/:userId", authRateLimiter, authMiddleware, listDirectMessagesController);
messagesRoutes.post("/messages/dm/:userId", authRateLimiter, authMiddleware, createDirectMessageController);

messagesRoutes.get(
  "/messages/social-networks/:socialNetworkId",
  authRateLimiter,
  authMiddleware,
  listSocialNetworkMessagesController
);
messagesRoutes.post(
  "/messages/social-networks/:socialNetworkId",
  authRateLimiter,
  authMiddleware,
  createSocialNetworkMessageController
);

messagesRoutes.delete("/messages/:id", authRateLimiter, authMiddleware, deleteMessageController);

export default messagesRoutes;

