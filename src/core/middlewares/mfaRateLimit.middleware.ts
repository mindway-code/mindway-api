import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { mfaError } from "../errors/httpError.js";
import {
  getFailedAttemptCount,
  SecurityStoreUnavailableError,
} from "../../infra/redis/securityStore.js";

export async function mfaRateLimitMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const attempts = await getFailedAttemptCount(req.user!.id, req.ip ?? "unknown");
    if (attempts >= env.MFA_ATTEMPT_MAX) {
      next(mfaError({ code: "MFA_RATE_LIMITED", statusCode: 429, message: "Too many MFA attempts. Try again later" }));
      return;
    }
    next();
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
}

export default mfaRateLimitMiddleware;
