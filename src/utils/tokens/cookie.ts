import { env } from "../../core/config/env.js";
import type { Request, Response } from "express";

export const REFRESH_COOKIE_NAME = env.COOKIE_NAME || "refresh_token";

export function cookieBaseOptions() {
  const isProd = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: env.COOKIE_PATH || "/",
  } as const;
}

export function setRefreshCookie(res: Response, refreshToken: string) {
  const maxAgeMs = env.COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  res.cookie(env.COOKIE_NAME, refreshToken, {
    ...cookieBaseOptions(),
    maxAge: maxAgeMs,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(env.COOKIE_NAME, {
    ...cookieBaseOptions(),
  });
}
