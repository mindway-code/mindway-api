import { Router } from "express";
import { authRateLimiter } from './../../../../core/middlewares/rateLimit.middleware';
import { sendSuccess } from "../../../../utils/response";
import { listUsersController } from "./users.controller.js";

export const userRoutes = Router();

userRoutes.get('/users', authRateLimiter, listUsersController);
