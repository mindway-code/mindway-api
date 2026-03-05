import { Router } from "express";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";

import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import authAdminMiddleware from "../../../../core/middlewares/authAdmin.middleware.js";

import {
  listUsersController,
  getMeController,
  createUserController,
  updateUserController,
  deleteUserController,
} from "./users.controller.js";

export const userRoutes = Router();


userRoutes.get(
  "/users",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  listUsersController
);
userRoutes.post(
  "/users",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  createUserController
);


userRoutes.get(
  "/users/me",
  authRateLimiter,
  authMiddleware,
  getMeController
);
userRoutes.patch(
  "/users/me",
  authRateLimiter,
  authMiddleware,
  updateUserController
);
userRoutes.delete(
  "/users/me",
  authRateLimiter,
  authMiddleware,
  deleteUserController
);


export default userRoutes;
