import { Router } from "express";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";

import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import authAdminMiddleware from "../../../../core/middlewares/authAdmin.middleware.js";

import {
  listUsersController,
  getMeController,
  createUserController,
  updateUserController,
  changeMyPasswordController,
  deleteUserController,
} from "./users.controller.js";
import { validate } from "../../../../core/middlewares/validate.middleware.js";
import {
  changeMyPasswordSchema,
  createUserSchema,
  updateMeSchema,
} from "../../validators/users.validator.js";

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
  validate(createUserSchema),
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
  validate(updateMeSchema),
  updateUserController
);
userRoutes.patch(
  "/users/me/password",
  authRateLimiter,
  authMiddleware,
  validate(changeMyPasswordSchema),
  changeMyPasswordController,
);
userRoutes.delete(
  "/users/me",
  authRateLimiter,
  authMiddleware,
  deleteUserController
);


export default userRoutes;
