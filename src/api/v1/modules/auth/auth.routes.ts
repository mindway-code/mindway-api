import { Router } from "express";
import { authRateLimiter } from './../../../../core/middlewares/rateLimit.middleware';
import { sendSuccess } from "../../../../utils/response";
import { loginController, refreshController, logoutController } from "./auth.controller.js";

export const authRoutes = Router();

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
