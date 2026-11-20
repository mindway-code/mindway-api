import { Router } from "express";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import { validate } from "../../../../core/middlewares/validate.middleware.js";
import requireStepUp from "../../../../core/middlewares/requireStepUp.middleware.js";
import requireIdempotencyKey from "../../../../core/middlewares/requireIdempotencyKey.middleware.js";
import { sendSuccess } from "../../../../utils/response.js";
import {
  childIdParamsSchema,
  createReportsChildSchema,
  listReportsChildrenQuerySchema,
  rejectReportSchema,
  reportIdParamsSchema,
  updateReportsChildSchema,
  validateReportSchema,
} from "../../validators/reportsChildren.validator.js";
import {
  createNextRevisionController,
  createReportForChildController,
  deleteReportController,
  getReportByIdController,
  listReportsByChildController,
  listRevisionHistoryController,
  rejectReportController,
  submitReportController,
  updateReportController,
  validateReportController,
} from "./reportsChildren.controller.js";

export const reportsChildrenRoutes = Router();
const protectedRoute = [authRateLimiter, authMiddleware] as const;

reportsChildrenRoutes.get("/reports-children/child/:childId", ...protectedRoute, validate(childIdParamsSchema, "params"), validate(listReportsChildrenQuerySchema, "query"), listReportsByChildController);
reportsChildrenRoutes.post("/reports-children/child/:childId", ...protectedRoute, validate(childIdParamsSchema, "params"), validate(createReportsChildSchema), createReportForChildController);
reportsChildrenRoutes.get("/reports-children/:id/revisions", ...protectedRoute, validate(reportIdParamsSchema, "params"), listRevisionHistoryController);
reportsChildrenRoutes.patch("/reports-children/:id/draft", ...protectedRoute, validate(reportIdParamsSchema, "params"), validate(updateReportsChildSchema), updateReportController);
reportsChildrenRoutes.post("/reports-children/:id/submissions", ...protectedRoute, validate(reportIdParamsSchema, "params"), submitReportController);
reportsChildrenRoutes.post(
  "/reports-children/:id/validations",
  ...protectedRoute,
  validate(reportIdParamsSchema, "params"),
  validate(validateReportSchema),
  requireIdempotencyKey,
  requireStepUp({
    action: "report.validate",
    resourceType: "reportRevision",
    getResourceId: (req) => req.body.revisionId as string,
  }),
  validateReportController,
);
reportsChildrenRoutes.post("/reports-children/:id/rejections", ...protectedRoute, validate(reportIdParamsSchema, "params"), validate(rejectReportSchema), rejectReportController);
reportsChildrenRoutes.post("/reports-children/:id/revisions", ...protectedRoute, validate(reportIdParamsSchema, "params"), createNextRevisionController);
reportsChildrenRoutes.get("/reports-children/:id", ...protectedRoute, validate(reportIdParamsSchema, "params"), getReportByIdController);
// Deprecated Phase 0 compatibility alias. New clients must use /:id/draft.
reportsChildrenRoutes.patch("/reports-children/:id", ...protectedRoute, validate(reportIdParamsSchema, "params"), validate(updateReportsChildSchema), updateReportController);
reportsChildrenRoutes.delete("/reports-children/:id", ...protectedRoute, validate(reportIdParamsSchema, "params"), deleteReportController);
reportsChildrenRoutes.get("/reports-children", authRateLimiter, (_req, res) => sendSuccess(res, {}, "ReportsChildren Routes Ok"));

export default reportsChildrenRoutes;
