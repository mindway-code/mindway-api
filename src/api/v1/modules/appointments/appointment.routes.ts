import { Router } from "express";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import authAdminMiddleware from "../../../../core/middlewares/authAdmin.middleware.js";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import { sendSuccess } from "../../../../utils/response.js";
import {
  createAppointmentController,
  deleteAppointmentController,
  listMyAppointmentsController,
  listMyTherapistAppointmentsController,
  updateAppointmentController,
} from "./appointment.controller.js";

export const appointmentRoutes = Router();

appointmentRoutes.get(
  "/appointments",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  listMyAppointmentsController
);
appointmentRoutes.get(
  "/appointments/therapist",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  listMyTherapistAppointmentsController
);
appointmentRoutes.post(
  "/appointments",
  authRateLimiter,
  authMiddleware,
  authAdminMiddleware,
  createAppointmentController
);
appointmentRoutes.put(
  "/appointments/:id",
  authRateLimiter,
  authMiddleware,
  updateAppointmentController
);
appointmentRoutes.delete(
  "/appointments/:id",
  authRateLimiter,
  authMiddleware,
  deleteAppointmentController
);

appointmentRoutes.get('/appointment', authRateLimiter,
  (_req, res) => {
    const data = {};
    const message = "Appointment Routes Ok";
    sendSuccess(res, data, message);
  }
);

export default appointmentRoutes;
