import type { Request, Response } from "express";
import { env } from "../../../../core/config/env.js";
import {
  registerService,
  loginService,
  refreshService,
  logoutService,
} from "./auth.service.js";
import { setRefreshCookie, clearRefreshCookie } from "../../../../utils/tokens/cookie.js";
import { sendSuccess, sendError } from "../../../../utils/response.js";

function readRefreshCookie(req: Request): string | undefined {
  const cookieName = env.COOKIE_NAME || "refresh_token";
  return (req.cookies as any)?.[cookieName] as string | undefined;
}


export async function registerController(req: Request, res: Response) {
  try {
    const body = req.body as import("./auth.types.js").RegisterDTO;
    const result = await registerService(body);

    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, { accessToken: result.accessToken }, "Registered");
  } catch (err) {
    return sendError(res, err);
  }
}


export async function loginController(req: Request, res: Response) {
  try {
    const body = req.body as import("./auth.types.js").LoginPayload;
    const result = await loginService(body.email ?? "", body.password ?? "");

    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, { accessToken: result.accessToken }, "Logged in");
  } catch (err) {
    return sendError(res, err);
  }
}


export async function refreshController(req: Request, res: Response) {
  try {
    const token = readRefreshCookie(req);
    const result = await refreshService(token ?? "");

    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, { accessToken: result.accessToken }, "Token refreshed");
  } catch (err) {
    // on invalid refresh, ensure cookie cleared
    try {
      clearRefreshCookie(res);
    } catch {}
    return sendError(res, err);
  }
}


export async function logoutController(req: Request, res: Response) {
  try {
    const token = readRefreshCookie(req);

    await logoutService(token);
    clearRefreshCookie(res);

    return sendSuccess(res, {}, "Logged out");
  } catch (err) {
    return sendError(res, err);
  }
}

export default {
  registerController,
  loginController,
  refreshController,
  logoutController,
};
