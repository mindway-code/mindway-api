import type { Request, Response, NextFunction } from "express";
import { extractBearerToken, verifyAccessToken } from "../../utils/crypto/jwt.js";
import { unauthorized } from "../errors/httpError.js";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
	try {
		const token = extractBearerToken(req.headers.authorization as string | undefined);
		if (!token) return next(unauthorized());

		const payload = verifyAccessToken(token);


		(req as any).user = { id: payload.sub, role: payload.role };

		return next();
	} catch (err) {
		return next(err);
	}
}

export default authMiddleware;
