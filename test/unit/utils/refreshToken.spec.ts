import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const jwtLib = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const env = {
  JWT_REFRESH_SECRET: "y".repeat(20),
  JWT_REFRESH_EXPIRES_IN: "30d",
};

jest.unstable_mockModule("jsonwebtoken", () => ({ default: jwtLib, sign: jwtLib.sign, verify: jwtLib.verify }));
jest.unstable_mockModule(fileURLToPath(new URL("../../../src/core/config/env.ts", import.meta.url)), () => ({ env }));

const { signRefreshToken, verifyRefreshToken } = await import("../../../src/utils/tokens/refreshToken.js");

describe("utils: tokens/refreshToken", () => {
  beforeEach(() => {
    jwtLib.sign.mockReset();
    jwtLib.verify.mockReset();
  });

  it("signRefreshToken calls jsonwebtoken.sign with expiresIn", () => {
    jwtLib.sign.mockReturnValue("refresh");
    const token = signRefreshToken({ sub: "u1", role: "common" } as any);
    expect(token).toBe("refresh");
    expect(jwtLib.sign).toHaveBeenCalledWith(expect.any(Object), env.JWT_REFRESH_SECRET, expect.objectContaining({ expiresIn: "30d" }));
  });

  it("verifyRefreshToken throws on invalid payload", () => {
    jwtLib.verify.mockReturnValue({ sub: 123 });
    expect(() => verifyRefreshToken("x")).toThrow();
  });

  it("verifyRefreshToken returns decoded fields", () => {
    jwtLib.verify.mockReturnValue({ sub: "u1", role: "common", jti: "j", iat: 1, exp: 2 });
    expect(verifyRefreshToken("x")).toEqual({ sub: "u1", role: "common", jti: "j", iat: 1, exp: 2 });
  });
});
