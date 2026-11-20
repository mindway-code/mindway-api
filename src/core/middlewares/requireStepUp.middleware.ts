import type { NextFunction, Request, RequestHandler, Response } from "express";
import { mfaError } from "../errors/httpError.js";
import {
  consumeStepUpGrant,
  SecurityStoreUnavailableError,
  type StepUpAction,
  type StepUpResourceType,
} from "../../infra/redis/securityStore.js";

type RequireStepUpConfig = {
  action: StepUpAction;
  resourceType: StepUpResourceType;
  getResourceId: (req: Request) => string;
};

export function requireStepUp(config: RequireStepUpConfig): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const proof = req.get("X-MFA-Proof")?.trim();
    if (!proof) {
      next(mfaError({ code: "MFA_PROOF_REQUIRED", statusCode: 401, message: "MFA proof is required" }));
      return;
    }

    try {
      const idempotencyKey = req.get("Idempotency-Key")?.trim();
      const result = await consumeStepUpGrant({
        token: proof,
        userId: req.user!.id,
        action: config.action,
        resourceType: config.resourceType,
        resourceId: config.getResourceId(req),
        ...(idempotencyKey ? { idempotencyKey } : {}),
      });

      if (result.status === "INVALID") {
        next(mfaError({ code: "MFA_PROOF_INVALID", statusCode: 401, message: "MFA proof is invalid" }));
        return;
      }
      if (result.status === "EXPIRED") {
        next(mfaError({ code: "MFA_PROOF_EXPIRED", statusCode: 401, message: "MFA proof has expired" }));
        return;
      }
      if (result.status === "ALREADY_USED") {
        next(mfaError({ code: "MFA_PROOF_ALREADY_USED", statusCode: 409, message: "MFA proof was already used" }));
        return;
      }
      if (result.status === "SCOPE_MISMATCH") {
        next(mfaError({ code: "MFA_PROOF_SCOPE_MISMATCH", statusCode: 403, message: "MFA proof scope does not match" }));
        return;
      }

      if (result.status === "CONSUMED" || result.status === "IDEMPOTENT_REPLAY") {
        req.stepUp = {
          method: result.grant.method,
          factorId: result.grant.factorId,
          idempotentReplay: result.status === "IDEMPOTENT_REPLAY",
        };
        next();
      }
    } catch (error) {
      if (error instanceof SecurityStoreUnavailableError) {
        next(mfaError({
          code: "MFA_SECURITY_STORE_UNAVAILABLE",
          statusCode: 503,
          message: "MFA security state is temporarily unavailable",
        }));
        return;
      }
      next(error);
    }
  };
}

export default requireStepUp;
