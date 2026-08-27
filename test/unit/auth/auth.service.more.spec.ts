import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { makeAuthServices } from "../../../src/api/v1/modules/auth/auth.service.js";
import { badRequest, unauthorized } from "../../../src/core/errors/httpError.js";

const repo = {
  findAuthUserByEmail: jest.fn<Promise<any>, [string]>(),
  createLocalUser: jest.fn(),
  createRefreshTokenRow: jest.fn(),
  findActiveRefreshTokensByUserId: jest.fn<Promise<any[]>, [string]>(),
  revokeRefreshTokenById: jest.fn(),
};

const cryptoHash = {
  hashPassword: jest.fn(async (v: string) => `hash(${v})`),
  verifyPassword: jest.fn(async () => false),
};

const jwtAccess = { signAccessToken: jest.fn(() => "access") };
const refreshToken = {
  signRefreshToken: jest.fn(() => "refresh"),
  verifyRefreshToken: jest.fn<any, [string]>(),
};

const { loginService, refreshService, logoutService } = makeAuthServices({
  env: { COOKIE_MAX_AGE_DAYS: 30 } as any,
  badRequest,
  unauthorized,
  signAccessToken: jwtAccess.signAccessToken as any,
  signRefreshToken: refreshToken.signRefreshToken as any,
  verifyRefreshToken: refreshToken.verifyRefreshToken as any,
  hashPassword: cryptoHash.hashPassword as any,
  verifyPassword: cryptoHash.verifyPassword as any,
  findAuthUserByEmail: repo.findAuthUserByEmail as any,
  createLocalUser: repo.createLocalUser as any,
  createRefreshTokenRow: repo.createRefreshTokenRow as any,
  findActiveRefreshTokensByUserId: repo.findActiveRefreshTokensByUserId as any,
  revokeRefreshTokenById: repo.revokeRefreshTokenById as any,
});

describe("auth: more flows", () => {
  beforeEach(() => {
    repo.findAuthUserByEmail.mockReset();
    repo.findActiveRefreshTokensByUserId.mockReset();
    repo.revokeRefreshTokenById.mockReset();
    cryptoHash.verifyPassword.mockReset();
    refreshToken.verifyRefreshToken.mockReset();
  });

  it("login rejects invalid credentials", async () => {
    repo.findAuthUserByEmail.mockResolvedValue(null);
    await expect(loginService("a@a.com", "x")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("refresh rejects when no matching active token", async () => {
    refreshToken.verifyRefreshToken.mockReturnValue({ sub: "u1", role: "common" });
    repo.findActiveRefreshTokensByUserId.mockResolvedValue([{ id: "rt1", tokenHash: "h" }]);
    cryptoHash.verifyPassword.mockResolvedValue(false);

    await expect(refreshService("refresh")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("logout ignores verification errors", async () => {
    refreshToken.verifyRefreshToken.mockImplementation(() => {
      throw new Error("bad");
    });
    await expect(logoutService("x")).resolves.toBeUndefined();
  });
});

