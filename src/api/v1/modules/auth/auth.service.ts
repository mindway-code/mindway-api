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



export type AuthServiceDeps = {
  env: Pick<typeof env, "COOKIE_MAX_AGE_DAYS">;
  badRequest: typeof badRequest;
  unauthorized: typeof unauthorized;

  signAccessToken: typeof signAccessToken;
  signRefreshToken: typeof signRefreshToken;
  verifyRefreshToken: typeof verifyRefreshToken;

  hashPassword: typeof hashPassword;
  verifyPassword: typeof verifyPassword;

  findAuthUserByEmail: typeof findAuthUserByEmail;
  createLocalUser: typeof createLocalUser;
  createRefreshTokenRow: typeof createRefreshTokenRow;
  findActiveRefreshTokensByUserId: typeof findActiveRefreshTokensByUserId;
  revokeRefreshTokenById: typeof revokeRefreshTokenById;
};

function computeRefreshExpiry(deps: AuthServiceDeps): Date {
  return new Date(Date.now() + (Number(deps.env.COOKIE_MAX_AGE_DAYS) || 7) * 24 * 60 * 60 * 1000);
}

export function makeAuthServices(deps: AuthServiceDeps) {
  async function registerService(dto: RegisterDTO): Promise<RegisterResult> {
    const name = dto.name?.trim();
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;
    const confirmPassword = dto.confirmPassword;

    if (password != confirmPassword) throw deps.badRequest("Password and ConfirmPassword are not equal");

    if (!name || !email || !password) throw deps.badRequest("Missing credentials");

    const existing = await deps.findAuthUserByEmail(email);
    if (existing) throw deps.badRequest("Email already in use");

    const role: UserRole = dto.role ?? "common";
    const provider = dto.provider ?? "local";

    const passwordHash = await deps.hashPassword(password);

    const input: CreateUserInput = {
      name,
      email,
      passwordHash,
      role,
      provider,
      googleId: dto.googleId ?? null,
    };

    const user = await deps.createLocalUser(input);

    const accessToken = deps.signAccessToken({ sub: user.id, role: user.role ?? "common" });
    const refreshToken = deps.signRefreshToken({ sub: user.id, role: user.role ?? "common" });

    const tokenHash = await deps.hashPassword(refreshToken);
    await deps.createRefreshTokenRow({
      userId: user.id,
      tokenHash,
      expiresAt: computeRefreshExpiry(deps),
    });

    return { accessToken, refreshToken };
  }

  async function loginService(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) throw deps.unauthorized("Missing credentials");

    const user = await deps.findAuthUserByEmail(normalizedEmail);
    if (!user || !user.passwordHash) throw deps.unauthorized("Invalid credentials");

    const ok = await deps.verifyPassword(password, user.passwordHash);
    if (!ok) throw deps.unauthorized("Password is incorrect");

    const role = (user.role ?? "common") as UserRole;

    const accessToken = deps.signAccessToken({ sub: user.id, role });
    const refreshToken = deps.signRefreshToken({ sub: user.id, role });

    const tokenHash = await deps.hashPassword(refreshToken);
    await deps.createRefreshTokenRow({
      userId: user.id,
      tokenHash,
      expiresAt: computeRefreshExpiry(deps),
    });

    return { accessToken, refreshToken };
  }

  async function refreshService(token: string): Promise<LoginResult> {
    if (!token) throw deps.unauthorized("Missing refresh token");

    const decoded = deps.verifyRefreshToken(token);
    const userId = decoded.sub;
    const role = (decoded.role ?? "common") as UserRole;

    const candidates = await deps.findActiveRefreshTokensByUserId(userId);

    let matchedId: string | null = null;
    for (const c of candidates) {
      const match = await deps.verifyPassword(token, c.tokenHash);
      if (match) {
        matchedId = c.id;
        break;
      }
    }

    if (!matchedId) throw deps.unauthorized("Invalid refresh token");

    await deps.revokeRefreshTokenById(matchedId);

    const newRefresh = deps.signRefreshToken({ sub: userId, role });
    const newHash = await deps.hashPassword(newRefresh);

    await deps.createRefreshTokenRow({
      userId,
      tokenHash: newHash,
      expiresAt: computeRefreshExpiry(deps),
    });

    const accessToken = deps.signAccessToken({ sub: userId, role });
    return { accessToken, refreshToken: newRefresh };
  }

  async function logoutService(token?: string): Promise<void> {
    if (!token) return;

    try {
      const decoded = deps.verifyRefreshToken(token);
      const userId = decoded.sub;

      const candidates = await deps.findActiveRefreshTokensByUserId(userId);

      for (const c of candidates) {
        const match = await deps.verifyPassword(token, c.tokenHash);
        if (match) {
          await deps.revokeRefreshTokenById(c.id);
          break;
        }
      }
    } catch {
      // ignore verification errors on logout
    }
  }

  return { registerService, loginService, refreshService, logoutService };
}

const defaultDeps: AuthServiceDeps = {
  env,
  badRequest,
  unauthorized,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
  findAuthUserByEmail,
  createLocalUser,
  createRefreshTokenRow,
  findActiveRefreshTokensByUserId,
  revokeRefreshTokenById,
};

export const { registerService, loginService, refreshService, logoutService } = makeAuthServices(defaultDeps);

export default { registerService, loginService, refreshService, logoutService };
