import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { badRequest } from "../errors/httpError.js";

type Target = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, target: Target = "body"): RequestHandler {
	return (req: Request, _res: Response, next: NextFunction) => {
		const raw = (req as any)[target];
		const result = schema.safeParse(raw);
		if (!result.success) {
			return next(badRequest("Validation failed", result.error.format()));
		}

		(req as any)[target] = result.data;
		return next();
	};
}

export default validate;
