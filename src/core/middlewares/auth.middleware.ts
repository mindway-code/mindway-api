import type { Request, Response, NextFunction } from "express";
import { extractBearerToken, verifyAccessToken } from "../../utils/crypto/jwt.js";
import { accessTokenInvalid, accessTokenMissing } from "../errors/httpError.js";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
	try {
		const authorization = req.headers.authorization as string | undefined;
		if (!authorization) return next(accessTokenMissing());

		const token = extractBearerToken(authorization);
		if (!token) return next(accessTokenInvalid());

		const payload = verifyAccessToken(token);


		(req as any).user = { id: payload.sub, role: payload.role };

		return next();
	} catch (err) {
		return next(err);
	}
}

export default authMiddleware;
