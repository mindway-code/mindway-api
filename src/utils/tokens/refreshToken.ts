import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../../core/config/env.js";
import { unauthorized } from "../../core/errors/httpError.js";
import { UserRole } from "../crypto/jwt.js";

export type RefreshTokenPayload = {
	sub: string;
  role?: UserRole;
	jti?: string;
};

type VerifiedRefreshToken = RefreshTokenPayload & {
	iat: number;
	exp: number;
};

export function signRefreshToken(payload: RefreshTokenPayload): string {
	const options: SignOptions = {};
	if (env.JWT_REFRESH_EXPIRES_IN) options.expiresIn = env.JWT_REFRESH_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>;

	return jwt.sign(payload as any, env.JWT_REFRESH_SECRET as jwt.Secret, options);
}

export function verifyRefreshToken(token: string): VerifiedRefreshToken {
	try {
		const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET as jwt.Secret) as JwtPayload;
		const sub = decoded.sub;
    const role = (decoded as any).role as UserRole;

		if (typeof sub !== "string") throw unauthorized("Invalid refresh token payload");

		return {
			sub,
      role,
			jti: (decoded as any).jti,
			iat: decoded.iat ?? 0,
			exp: decoded.exp ?? 0,
		};
	} catch {
		throw unauthorized("Invalid or expired refresh token");
	}
}
