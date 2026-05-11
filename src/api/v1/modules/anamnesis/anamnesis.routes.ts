import { Router } from "express";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import { validate } from "../../../../core/middlewares/validate.middleware.js";
import {
  childIdParamsSchema,
  updateGeneralNotesSchema,
  upsertBehaviorSchema,
  upsertBirthSchema,
  upsertHealthSchema,
  upsertLanguageCommunicationSchema,
  upsertMotorDevelopmentSchema,
  upsertRoutineSchema,
} from "../../validators/anamnesis.validator.js";
import {
  createAnamnesisController,
  deleteBehaviorController,
  deleteBirthController,
  deleteHealthController,
  deleteLanguageCommunicationController,
  deleteMotorDevelopmentController,
  deleteRoutineController,
  getAnamnesisByChildIdController,
  updateGeneralNotesController,
  upsertBehaviorController,
  upsertBirthController,
  upsertHealthController,
  upsertLanguageCommunicationController,
  upsertMotorDevelopmentController,
  upsertRoutineController,
} from "./anamnesis.controller.js";

export const anamnesisRoutes = Router();

anamnesisRoutes.get(
  "/children/:childId/anamnesis",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  getAnamnesisByChildIdController
);

anamnesisRoutes.post(
  "/children/:childId/anamnesis",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  createAnamnesisController
);

anamnesisRoutes.patch(
  "/children/:childId/anamnesis/general-notes",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(updateGeneralNotesSchema),
  updateGeneralNotesController
);

// Sections: accept both POST and PUT for upsert behavior (frontend may call either).
anamnesisRoutes.post(
  "/children/:childId/anamnesis/birth",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertBirthSchema),
  upsertBirthController
);
anamnesisRoutes.put(
  "/children/:childId/anamnesis/birth",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertBirthSchema),
  upsertBirthController
);
anamnesisRoutes.delete(
  "/children/:childId/anamnesis/birth",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  deleteBirthController
);

anamnesisRoutes.post(
  "/children/:childId/anamnesis/motor-development",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertMotorDevelopmentSchema),
  upsertMotorDevelopmentController
);
anamnesisRoutes.put(
  "/children/:childId/anamnesis/motor-development",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertMotorDevelopmentSchema),
  upsertMotorDevelopmentController
);
anamnesisRoutes.delete(
  "/children/:childId/anamnesis/motor-development",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  deleteMotorDevelopmentController
);

anamnesisRoutes.post(
  "/children/:childId/anamnesis/language-communication",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertLanguageCommunicationSchema),
  upsertLanguageCommunicationController
);
anamnesisRoutes.put(
  "/children/:childId/anamnesis/language-communication",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertLanguageCommunicationSchema),
  upsertLanguageCommunicationController
);
anamnesisRoutes.delete(
  "/children/:childId/anamnesis/language-communication",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  deleteLanguageCommunicationController
);

anamnesisRoutes.post(
  "/children/:childId/anamnesis/health",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertHealthSchema),
  upsertHealthController
);
anamnesisRoutes.put(
  "/children/:childId/anamnesis/health",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertHealthSchema),
  upsertHealthController
);
anamnesisRoutes.delete(
  "/children/:childId/anamnesis/health",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  deleteHealthController
);

anamnesisRoutes.post(
  "/children/:childId/anamnesis/behavior",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertBehaviorSchema),
  upsertBehaviorController
);
anamnesisRoutes.put(
  "/children/:childId/anamnesis/behavior",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertBehaviorSchema),
  upsertBehaviorController
);
anamnesisRoutes.delete(
  "/children/:childId/anamnesis/behavior",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  deleteBehaviorController
);

anamnesisRoutes.post(
  "/children/:childId/anamnesis/routine",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertRoutineSchema),
  upsertRoutineController
);
anamnesisRoutes.put(
  "/children/:childId/anamnesis/routine",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(upsertRoutineSchema),
  upsertRoutineController
);
anamnesisRoutes.delete(
  "/children/:childId/anamnesis/routine",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  deleteRoutineController
);

export default anamnesisRoutes;

