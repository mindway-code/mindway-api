

import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../core/errors/httpError.js";
import { logger } from "../core/logger/logger.js";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: { pagination?: PaginationMeta };
  message?: string;
};

export function sendSuccess<T>(res: Response, data: T, message?: string, meta?: unknown) {
  const payload: SuccessResponse<T> = { success: true, data };
  if (message) payload.message = message;
  if (meta) (payload as any).meta = meta;
  return res.json(payload);
}

export function sendError(res: Response, err: unknown) {
  if (err instanceof HttpError) {
    const body = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    return res.status(err.statusCode).json(body);
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  return sendError(res, err);
}
