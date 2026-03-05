import { Router } from "express";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import authAdminMiddleware from "../../../../core/middlewares/authAdmin.middleware.js";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import { sendSuccess } from "../../../../utils/response.js";
import {
  createTaskController,
  deleteTaskController,
  listMyTasksController,
  listMyTherapistTasksController,
  updateTaskController
} from "./tasks.controller.js";

export const taskRoutes = Router();

taskRoutes.get(
  "/tasks",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  listMyTasksController
);
taskRoutes.get(
  "/tasks/therapist",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  listMyTherapistTasksController
);
taskRoutes.post(
  "/tasks",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  createTaskController
);
taskRoutes.put(
  "/tasks/:id",
  authRateLimiter,
  authMiddleware,
  updateTaskController
);
taskRoutes.delete(
  "/tasks/:id",
  authRateLimiter,
  authMiddleware,
  deleteTaskController
);

taskRoutes.get('/task', authRateLimiter,
  (_req, res) => {
    const data = {};
    const message = "Task Routes Ok";
    sendSuccess(res, data, message);
  }
);

export default taskRoutes;
