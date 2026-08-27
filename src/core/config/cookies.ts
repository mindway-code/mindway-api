import { env } from "./env.js";

export function cookieOptions() {
	const maxAge = (env.COOKIE_MAX_AGE_DAYS ?? 30) * 24 * 60 * 60 * 1000;

	return {
		httpOnly: true,
		secure: Boolean(env.COOKIE_SECURE),
		domain: env.COOKIE_DOMAIN || undefined,
		sameSite: env.COOKIE_SAMESITE as "lax" | "strict" | "none",
		path: env.COOKIE_PATH || "/",
		maxAge,
	};
}

export default cookieOptions;
