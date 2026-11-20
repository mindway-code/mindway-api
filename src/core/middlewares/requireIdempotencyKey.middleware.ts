import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { badRequest } from "../errors/httpError.js";

const idempotencyKeySchema = z.string().uuid();

export function requireIdempotencyKey(req: Request, _res: Response, next: NextFunction): void {
  const result = idempotencyKeySchema.safeParse(req.get("Idempotency-Key")?.trim());
  if (!result.success) {
    next(badRequest("A UUID Idempotency-Key header is required"));
    return;
  }
  next();
}

export default requireIdempotencyKey;
