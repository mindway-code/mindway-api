import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { tooManyRequests } from "../errors/httpError.js";
import type { Request, Response, NextFunction } from "express";

export const authRateLimiter = rateLimit({
	windowMs: Number(env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
	max: Number(env.AUTH_RATE_LIMIT_MAX) || 20,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (_req: Request, _res: Response, next: NextFunction) => next(tooManyRequests()),
});

export default authRateLimiter;
