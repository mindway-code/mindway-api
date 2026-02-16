import { Router } from "express";
import { authRateLimiter } from './../../core/middlewares/rateLimit.middleware';
import { sendSuccess } from "../../utils/response";
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/users/users.routes";

export const v1Routes = Router();

v1Routes.use(authRoutes);
v1Routes.use(userRoutes);

v1Routes.get('/health', authRateLimiter,
  (_req, res) => {
    const data = {};
    const message = "Server Ok";
    sendSuccess(res, data, message);
  }
);
