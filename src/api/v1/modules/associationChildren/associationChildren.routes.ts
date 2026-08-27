import { Router } from "express";
import authRateLimiter from "../../../../core/middlewares/rateLimit.middleware.js";
import authMiddleware from "../../../../core/middlewares/auth.middleware.js";
import { validate } from "../../../../core/middlewares/validate.middleware.js";
import { sendSuccess } from "../../../../utils/response.js";
import { createAssociationChildSchema } from "../../validators/associationChildren.validator.js";
import { associateByAccessCodeController } from "./associationChildren.controller.js";

export const associationChildrenRoutes = Router();

associationChildrenRoutes.post(
  "/association-children",
  authRateLimiter,
  authMiddleware,
  validate(createAssociationChildSchema),
  associateByAccessCodeController,
);

associationChildrenRoutes.get("/association-children", authRateLimiter, (_req, res) => {
  const data = {};
  const message = "AssociationChildren Routes Ok";
  sendSuccess(res, data, message);
});

export default associationChildrenRoutes;

