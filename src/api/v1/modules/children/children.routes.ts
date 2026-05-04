import { Router } from "express";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import { validate } from "../../../../core/middlewares/validate.middleware.js";
import { sendSuccess } from "../../../../utils/response.js";
import {
  accessCodeParamsSchema,
  childIdParamsSchema,
  createChildSchema,
  listChildrenQuerySchema,
  updateChildSchema,
} from "../../validators/children.validator.js";
import {
  createChildController,
  deleteChildController,
  getChildByAccessCodeController,
  getChildByIdController,
  listChildrenController,
  updateChildController,
} from "./children.controller.js";

export const childrenRoutes = Router();

childrenRoutes.post(
  "/children",
  authRateLimiter,
  authMiddleware,
  validate(createChildSchema),
  createChildController,
);

childrenRoutes.get(
  "/children",
  authRateLimiter,
  authMiddleware,
  validate(listChildrenQuerySchema, "query"),
  listChildrenController,
);

childrenRoutes.get(
  "/children/:id",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  getChildByIdController,
);

childrenRoutes.patch(
  "/children/:id",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  validate(updateChildSchema),
  updateChildController,
);

childrenRoutes.delete(
  "/children/:id",
  authRateLimiter,
  authMiddleware,
  validate(childIdParamsSchema, "params"),
  deleteChildController,
);

// Code-based access for restricted roles (therapist/professional/enterprise)
childrenRoutes.get(
  "/children/access/:code",
  authRateLimiter,
  authMiddleware,
  validate(accessCodeParamsSchema, "params"),
  getChildByAccessCodeController,
);

childrenRoutes.get("/child", authRateLimiter, (_req, res) => {
  const data = {};
  const message = "Children Routes Ok";
  sendSuccess(res, data, message);
});

export default childrenRoutes;
