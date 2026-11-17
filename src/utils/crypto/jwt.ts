import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../../core/config/env.js";
import { accessTokenExpired, accessTokenInvalid } from "../../core/errors/httpError.js";


export type UserRole = "admin" | "therapist" | "common" | "enterprise" | "professional";

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

const USER_ROLES: UserRole[] = ["admin", "therapist", "common", "enterprise", "professional"];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

type VerifiedAccessToken = AccessTokenPayload & {
  iat: number;
  exp: number;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {};

  if (env.JWT_ACCESS_EXPIRES_IN) {
    options.expiresIn = env.JWT_ACCESS_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>;
  }

  return jwt.sign(payload, env.JWT_ACCESS_SECRET as jwt.Secret, options);
}

export function verifyAccessToken(token: string): VerifiedAccessToken {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET as jwt.Secret) as JwtPayload;

    const sub = decoded.sub;
    const role = (decoded as { role?: unknown }).role;

    if (typeof sub !== "string" || !isUserRole(role)) {
      throw accessTokenInvalid();
    }

    return {
      sub,
      role,
      iat: decoded.iat ?? 0,
      exp: decoded.exp ?? 0,
    };
  } catch (err) {
    if ((err as { name?: string } | null)?.name === "TokenExpiredError") {
      throw accessTokenExpired();
    }
    throw accessTokenInvalid();
  }
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}
