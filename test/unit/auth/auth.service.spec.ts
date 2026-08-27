import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { makeAuthServices } from "../../../src/api/v1/modules/auth/auth.service.js";
import { badRequest } from "../../../src/core/errors/httpError.js";

const authRepo = {
  findAuthUserByEmail: jest.fn<Promise<any>, [string]>(),
  createLocalUser: jest.fn<Promise<any>, [any]>(),
  createRefreshTokenRow: jest.fn<Promise<any>, [any]>(),
  findActiveRefreshTokensByUserId: jest.fn<Promise<any[]>, [string]>(),
  revokeRefreshTokenById: jest.fn<Promise<any>, [string]>(),
};

const cryptoHash = {
  hashPassword: jest.fn(async (value: string) => `hash(${value})`),
  verifyPassword: jest.fn(async () => true),
};

const jwtAccess = {
  signAccessToken: jest.fn(() => "access-token"),
};

const refreshToken = {
  signRefreshToken: jest.fn(() => "refresh-token"),
  verifyRefreshToken: jest.fn<any, [string]>(),
};

const { registerService } = makeAuthServices({
  env: { COOKIE_MAX_AGE_DAYS: 30 } as any,
  badRequest,
  unauthorized: (...args: any[]) => {
    throw new Error(`unauthorized called unexpectedly: ${String(args[0] ?? "")}`);
  },
  signAccessToken: jwtAccess.signAccessToken as any,
  signRefreshToken: refreshToken.signRefreshToken as any,
  verifyRefreshToken: refreshToken.verifyRefreshToken as any,
  hashPassword: cryptoHash.hashPassword as any,
  verifyPassword: cryptoHash.verifyPassword as any,
  findAuthUserByEmail: authRepo.findAuthUserByEmail as any,
  createLocalUser: authRepo.createLocalUser as any,
  createRefreshTokenRow: authRepo.createRefreshTokenRow as any,
  findActiveRefreshTokensByUserId: authRepo.findActiveRefreshTokensByUserId as any,
  revokeRefreshTokenById: authRepo.revokeRefreshTokenById as any,
});

describe("auth: registerService", () => {
  beforeEach(() => {
    jest.useRealTimers();
    authRepo.findAuthUserByEmail.mockReset();
    authRepo.createLocalUser.mockReset();
    authRepo.createRefreshTokenRow.mockReset();
    cryptoHash.hashPassword.mockClear();
    jwtAccess.signAccessToken.mockClear();
    refreshToken.signRefreshToken.mockClear();
  });

  it("rejects when password confirmation mismatches", async () => {
    await expect(
      registerService({ name: "A", email: "a@a.com", password: "x", confirmPassword: "y" } as any),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects when email already exists", async () => {
    authRepo.findAuthUserByEmail.mockResolvedValue({ id: "u1" });

    await expect(
      registerService({ name: "A", email: "a@a.com", password: "x", confirmPassword: "x" } as any),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("creates user + refresh token row and returns tokens", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    authRepo.findAuthUserByEmail.mockResolvedValue(null);
    authRepo.createLocalUser.mockResolvedValue({ id: "u1", role: "common" });

    const result = await registerService({
      name: "  Alice  ",
      email: "ALICE@EXAMPLE.COM",
      password: "pass",
      confirmPassword: "pass",
    } as any);

    expect(result).toEqual({ accessToken: "access-token", refreshToken: "refresh-token" });
    expect(authRepo.createLocalUser).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Alice",
        email: "alice@example.com",
        passwordHash: "hash(pass)",
        role: "common",
        provider: "local",
      }),
    );
    expect(authRepo.createRefreshTokenRow).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        tokenHash: "hash(refresh-token)",
        expiresAt: new Date("2026-01-31T00:00:00.000Z"),
      }),
    );
  });
});
