import type { Request, Response } from "express";
import { env } from "../../../../core/config/env.js";
import { loginService, refreshService, logoutService } from "./auth.service.js";
import { setRefreshCookie, clearRefreshCookie } from "../../../../utils/tokens/cookie.js";
import { sendSuccess, sendError } from "../../../../utils/response.js";

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    const result = await loginService(email ?? "", password ?? "");
    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, { accessToken: result.accessToken }, "Logged in");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function refreshController(req: Request, res: Response) {
  try {
    const cookieName = env.COOKIE_NAME || "refresh_token";
    const token = (req.cookies as any)?.[cookieName] as string | undefined;
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
    const cookieName = env.COOKIE_NAME || "refresh_token";
    const token = (req.cookies as any)?.[cookieName] as string | undefined;
    await logoutService(token);
    clearRefreshCookie(res);
    return sendSuccess(res, {}, "Logged out");
  } catch (err) {
    return sendError(res, err);
  }
}

export default { loginController, refreshController, logoutController };
