import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const jwtLib = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const env = {
  JWT_ACCESS_SECRET: "x".repeat(20),
  JWT_ACCESS_EXPIRES_IN: "15m",
};

jest.unstable_mockModule("jsonwebtoken", () => ({ default: jwtLib, sign: jwtLib.sign, verify: jwtLib.verify }));
jest.unstable_mockModule(fileURLToPath(new URL("../../../src/core/config/env.ts", import.meta.url)), () => ({ env }));

const { extractBearerToken, signAccessToken, verifyAccessToken } = await import("../../../src/utils/crypto/jwt.js");

describe("utils: crypto/jwt", () => {
  beforeEach(() => {
    jwtLib.sign.mockReset();
    jwtLib.verify.mockReset();
  });

  it("extractBearerToken parses header", () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken("Basic x")).toBeNull();
    expect(extractBearerToken("Bearer token")).toBe("token");
  });

  it("signAccessToken calls jsonwebtoken.sign with expiresIn", () => {
    jwtLib.sign.mockReturnValue("signed");
    const token = signAccessToken({ sub: "u1", role: "common" } as any);
    expect(token).toBe("signed");
    expect(jwtLib.sign).toHaveBeenCalledWith(expect.any(Object), env.JWT_ACCESS_SECRET, expect.objectContaining({ expiresIn: "15m" }));
  });

  it("verifyAccessToken throws unauthorized on invalid payload", () => {
    jwtLib.verify.mockReturnValue({ sub: 123 });
    expect(() => verifyAccessToken("t")).toThrow();
  });

  it("verifyAccessToken returns decoded fields", () => {
    jwtLib.verify.mockReturnValue({ sub: "u1", role: "admin", iat: 1, exp: 2 });
    expect(verifyAccessToken("t")).toEqual({ sub: "u1", role: "admin", iat: 1, exp: 2 });
  });
});
