import { Router } from "express";
import { loginController, refreshController, logoutController, registerController } from "./auth.controller.js";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import { sendSuccess } from "../../../../utils/response.js";

export const authRoutes = Router();

authRoutes.post('/auth/register', authRateLimiter, registerController);
authRoutes.post('/auth/login', authRateLimiter, loginController);
authRoutes.post('/auth/refresh', authRateLimiter, refreshController);
authRoutes.post('/auth/logout', authRateLimiter, logoutController);

authRoutes.get('/auth', authRateLimiter,
  (_req, res) => {
    const data = {};
    const message = "Auth Routes Ok";
    sendSuccess(res, data, message);
  }
);
