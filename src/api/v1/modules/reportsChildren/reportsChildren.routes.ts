import { Router } from "express";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import { validate } from "../../../../core/middlewares/validate.middleware.js";
import { sendSuccess } from "../../../../utils/response.js";
import {
  childIdParamsSchema,
  createReportsChildSchema,
  listReportsChildrenQuerySchema,
  reportIdParamsSchema,
  updateReportsChildSchema,
} from "../../validators/reportsChildren.validator.js";
import {
  createReportForChildController,
  deleteReportController,
  getReportByIdController,
  listReportsByChildController,
  updateReportController,
} from "./reportsChildren.controller.js";

export const reportsChildrenRoutes = Router();

reportsChildrenRoutes.get(
  "/reports-children/child/:childId",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(listReportsChildrenQuerySchema, "query"),
  listReportsByChildController,
);

reportsChildrenRoutes.post(
  "/reports-children/child/:childId",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(createReportsChildSchema),
  createReportForChildController,
);

reportsChildrenRoutes.get(
  "/reports-children/:id",
  authRateLimiter,
  authMiddleware,
  validate(reportIdParamsSchema, "params"),
  getReportByIdController,
);

reportsChildrenRoutes.patch(
  "/reports-children/:id",
  authRateLimiter,
  authMiddleware,
  validate(reportIdParamsSchema, "params"),
  validate(updateReportsChildSchema),
  updateReportController,
);

reportsChildrenRoutes.delete(
  "/reports-children/:id",
  authRateLimiter,
  authMiddleware,
  validate(reportIdParamsSchema, "params"),
  deleteReportController,
);

reportsChildrenRoutes.get("/reports-children", authRateLimiter, (_req, res) => {
  const data = {};
  const message = "ReportsChildren Routes Ok";
  sendSuccess(res, data, message);
});

export default reportsChildrenRoutes;

