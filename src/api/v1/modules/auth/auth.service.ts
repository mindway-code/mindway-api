import { env } from "../../../../core/config/env.js";
import { badRequest, unauthorized } from "../../../../core/errors/httpError.js";

import { signAccessToken, type UserRole } from "../../../../utils/crypto/jwt.js";
import { signRefreshToken, verifyRefreshToken } from "../../../../utils/tokens/refreshToken.js";
import { hashPassword, verifyPassword } from "../../../../utils/crypto/hash.js";

import {
  findAuthUserByEmail,
  createLocalUser,
  createRefreshTokenRow,
  findActiveRefreshTokensByUserId,
  revokeRefreshTokenById,
} from "../../../../infra/database/repositories/auth.repository.js";
import type { CreateUserInput, LoginResult, RegisterDTO, RegisterResult } from "./auth.types.js";



function computeRefreshExpiry(): Date {
  return new Date(Date.now() + (Number(env.COOKIE_MAX_AGE_DAYS) || 7) * 24 * 60 * 60 * 1000);
}


export async function registerService(dto: RegisterDTO): Promise<RegisterResult> {
  const name = dto.name?.trim();
  const email = dto.email?.trim().toLowerCase();
  const password = dto.password;
  const confirmPassword = dto.confirmPassword;

  if (password != confirmPassword) throw badRequest("Password and ConfirmPassword are not equal");

  if (!name || !email || !password) throw badRequest("Missing credentials");

  const existing = await findAuthUserByEmail(email);
  if (existing) throw badRequest("Email already in use");

  const role: UserRole = dto.role ?? "common";
  const provider = dto.provider ?? "local";

  const passwordHash = await hashPassword(password);

  const input: CreateUserInput = {
    name,
    email,
    passwordHash,
    role,
    provider,
    googleId: dto.googleId ?? null,
  };

  const user = await createLocalUser(input);

  const accessToken = signAccessToken({ sub: user.id, role: user.role ?? "common" });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role ?? "common" });

  const tokenHash = await hashPassword(refreshToken);
  await createRefreshTokenRow({
    userId: user.id,
    tokenHash,
    expiresAt: computeRefreshExpiry(),
  });

  return { accessToken, refreshToken };
}


export async function loginService(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) throw unauthorized("Missing credentials");

  const user = await findAuthUserByEmail(normalizedEmail);
  if (!user || !user.passwordHash) throw unauthorized("Invalid credentials");

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw unauthorized("Password is incorrect");

  const role = (user.role ?? "common") as UserRole;

  const accessToken = signAccessToken({ sub: user.id, role });
  const refreshToken = signRefreshToken({ sub: user.id, role });

  const tokenHash = await hashPassword(refreshToken);
  await createRefreshTokenRow({
    userId: user.id,
    tokenHash,
    expiresAt: computeRefreshExpiry(),
  });

  return { accessToken, refreshToken };
}


export async function refreshService(token: string): Promise<LoginResult> {
  if (!token) throw unauthorized("Missing refresh token");

  const decoded = verifyRefreshToken(token);
  const userId = decoded.sub;
  const role = (decoded.role ?? "common") as UserRole;

  const candidates = await findActiveRefreshTokensByUserId(userId);

  let matchedId: string | null = null;
  for (const c of candidates) {
    const match = await verifyPassword(token, c.tokenHash);
    if (match) {
      matchedId = c.id;
      break;
    }
  }

  if (!matchedId) throw unauthorized("Invalid refresh token");

  await revokeRefreshTokenById(matchedId);

  const newRefresh = signRefreshToken({ sub: userId, role });
  const newHash = await hashPassword(newRefresh);

  await createRefreshTokenRow({
    userId,
    tokenHash: newHash,
    expiresAt: computeRefreshExpiry(),
  });

  const accessToken = signAccessToken({ sub: userId, role });
  return { accessToken, refreshToken: newRefresh };
}


export async function logoutService(token?: string): Promise<void> {
  if (!token) return;

  try {
    const decoded = verifyRefreshToken(token);
    const userId = decoded.sub;

    const candidates = await findActiveRefreshTokensByUserId(userId);

    for (const c of candidates) {
      const match = await verifyPassword(token, c.tokenHash);
      if (match) {
        await revokeRefreshTokenById(c.id);
        break;
      }
    }
  } catch {
    // ignore verification errors on logout
  }
}

export default { registerService, loginService, refreshService, logoutService };
