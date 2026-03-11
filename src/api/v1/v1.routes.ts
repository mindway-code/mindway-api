import { Router } from "express";
import authRateLimiter from "../../core/middlewares/rateLimit.middleware.js";
import { sendSuccess } from "../../utils/response.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import familyRoutes from "./modules/families/families.routes.js";
import taskRoutes from "./modules/tasks/task.routes.js";
import appointmentRoutes from "./modules/appointments/appointment.routes.js";
import familyMemberRoutes from "./modules/familyMembers/familyMember.routes.js";
import socialNetworkRoutes from "./modules/socialNetworks/socialNetwork.routes.js";
import socialNetworkUserRoutes  from "./modules/socialNetworkUsers/socialNetworkUser.routes.js";
import messagesRoutes from "./modules/messages/messages.routes.js";

export const v1Routes = Router();

v1Routes.use(authRoutes);
v1Routes.use(appointmentRoutes);
v1Routes.use(userRoutes);
v1Routes.use(familyRoutes);
v1Routes.use(familyMemberRoutes);
v1Routes.use(taskRoutes);
v1Routes.use(socialNetworkRoutes);
v1Routes.use(socialNetworkUserRoutes);
v1Routes.use(messagesRoutes);

v1Routes.get('/health', authRateLimiter,
  (_req, res) => {
    const data = {};
    const message = "Server Ok";
    sendSuccess(res, data, message);
  }
);
