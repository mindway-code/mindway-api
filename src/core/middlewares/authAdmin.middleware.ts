import type { Request, Response, NextFunction } from "express";
import { forbidden } from "../errors/httpError.js";

export function authAdminMiddleware(req: Request, _res: Response, next: NextFunction) {
	const user = (req as any).user as { id?: string; role?: string } | undefined;
	if (!user || user.role !== "admin") return next(forbidden());
	return next();
}

export default authAdminMiddleware;
