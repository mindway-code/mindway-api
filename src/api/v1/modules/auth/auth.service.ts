import { env } from "../../../../core/config/env.js";
import { signAccessToken } from "../../../../utils/crypto/jwt.js";
import { signRefreshToken, verifyRefreshToken } from "../../../../utils/tokens/refreshToken.js";
import { hashPassword, verifyPassword } from "../../../../utils/crypto/hash.js";
import { findUserByEmail } from "../../../../infra/database/repositories/users.repository.js";
import {
	createRefreshToken,
	findActiveByUserId,
	revokeById,
} from "../../../../infra/database/repositories/refreshTokens.repository.js";
import { unauthorized } from "../../../../core/errors/httpError.js";

export type LoginResult = {
	accessToken: string;
	refreshToken: string;
};

export async function loginService(email: string, password: string): Promise<LoginResult> {
	if (!email || !password) throw unauthorized("Missing credentials");

	const user = await findUserByEmail(email);
	if (!user || !user.password) throw unauthorized("Invalid credentials");

	const ok = await verifyPassword(password, user.password as string);
	if (!ok) throw unauthorized("Invalid credentials");

	const accessToken = signAccessToken({ sub: user.id, role: (user.role as any) ?? "common" });
	const refreshToken = signRefreshToken({ sub: user.id });

	const tokenHash = await hashPassword(refreshToken);
	const expiresAt =
  new Date(
    Date.now() +
    (Number(env.COOKIE_MAX_AGE_DAYS) || 7) * 24 * 60 * 60 * 1000
  );

	await createRefreshToken({ userId: user.id, tokenHash, expiresAt });

	return { accessToken, refreshToken };
}

export async function refreshService(token: string): Promise<LoginResult> {
	if (!token) throw unauthorized("Missing refresh token");

	const decoded = verifyRefreshToken(token);
	const userId = decoded.sub;

	const candidates = await findActiveByUserId(userId);
	let matched = null as null | { id: string };
	for (const c of candidates) {
		const match = await verifyPassword(token, c.tokenHash);
		if (match) {
			matched = { id: c.id };
			break;
		}
	}

	if (!matched) throw unauthorized("Invalid refresh token");

	// revoke old token and issue a new one (rotation)
	await revokeById(matched.id);
	const newRefresh = signRefreshToken({ sub: userId });
	const newHash = await hashPassword(newRefresh);
	const expiresAt = new Date(Date.now() + (Number(env.COOKIE_MAX_AGE_DAYS) || 7) * 24 * 60 * 60 * 1000);
	await createRefreshToken({ userId, tokenHash: newHash, expiresAt });

	const accessToken = signAccessToken({ sub: userId, role: "common" });
	return { accessToken, refreshToken: newRefresh };
}

export async function logoutService(token?: string): Promise<void> {
	if (!token) return;

	try {
		const decoded = verifyRefreshToken(token);
		const userId = decoded.sub;
		const candidates = await findActiveByUserId(userId);
		for (const c of candidates) {
			const match = await verifyPassword(token, c.tokenHash);
			if (match) {
				await revokeById(c.id);
				break;
			}
		}
	} catch {
		// ignore verification errors on logout
	}
}

export default { loginService, refreshService, logoutService };

