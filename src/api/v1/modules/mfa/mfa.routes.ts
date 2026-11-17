import { Router } from "express";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import mfaRateLimitMiddleware from "../../../../core/middlewares/mfaRateLimit.middleware.js";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import { validate } from "../../../../core/middlewares/validate.middleware.js";
import {
  confirmTotpEnrollmentSchema,
  mfaEnrollmentParamsSchema,
  mfaProtectedActionSchema,
  startTotpEnrollmentSchema,
} from "../../validators/mfa.validator.js";
import {
  confirmTotpEnrollmentController,
  disableTotpController,
  getMfaStatusController,
  regenerateRecoveryCodesController,
  startTotpEnrollmentController,
} from "./mfa.controller.js";

export const mfaRoutes = Router();

mfaRoutes.get("/auth/mfa", authRateLimiter, authMiddleware, getMfaStatusController);
mfaRoutes.post(
  "/auth/mfa/totp/enrollments",
  authRateLimiter,
  authMiddleware,
  mfaRateLimitMiddleware,
  validate(startTotpEnrollmentSchema),
  startTotpEnrollmentController,
);
mfaRoutes.post(
  "/auth/mfa/totp/enrollments/:id/confirm",
  authRateLimiter,
  authMiddleware,
  mfaRateLimitMiddleware,
  validate(mfaEnrollmentParamsSchema, "params"),
  validate(confirmTotpEnrollmentSchema),
  confirmTotpEnrollmentController,
);
mfaRoutes.post(
  "/auth/mfa/recovery-codes/regenerate",
  authRateLimiter,
  authMiddleware,
  mfaRateLimitMiddleware,
  validate(mfaProtectedActionSchema),
  regenerateRecoveryCodesController,
);
mfaRoutes.delete(
  "/auth/mfa/totp",
  authRateLimiter,
  authMiddleware,
  mfaRateLimitMiddleware,
  validate(mfaProtectedActionSchema),
  disableTotpController,
);

export default mfaRoutes;
