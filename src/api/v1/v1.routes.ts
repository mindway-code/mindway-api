import { Router } from "express";
import authRateLimiter from "../../core/middlewares/rateLimit.middleware.js";
import { sendSuccess } from "../../utils/response.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import familyRoutes from "./modules/families/families.routes.js";
import taskRoutes from "./modules/tasks/task.routes.js";

export const v1Routes = Router();

v1Routes.use(authRoutes);
v1Routes.use(userRoutes);
v1Routes.use(familyRoutes);
v1Routes.use(taskRoutes);

v1Routes.get('/health', authRateLimiter,
  (_req, res) => {
    const data = {};
    const message = "Server Ok";
    sendSuccess(res, data, message);
  }
);
