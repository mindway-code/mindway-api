import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const jwtUtils = {
  extractBearerToken: jest.fn(),
  verifyAccessToken: jest.fn(),
};

jest.unstable_mockModule("../../src/utils/crypto/jwt.js", () => jwtUtils);

const { authMiddleware } = await import("../../src/core/middlewares/auth.middleware.js");

describe("middlewares: authMiddleware", () => {
  beforeEach(() => {
    jwtUtils.extractBearerToken.mockReset();
    jwtUtils.verifyAccessToken.mockReset();
  });

  it("calls next(unauthorized) when header missing", () => {
    const req = mockReq({ headers: {} as any });
    const res = mockRes();
    const next = jest.fn();

    jwtUtils.extractBearerToken.mockReturnValue(null);

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "ACCESS_TOKEN_MISSING", statusCode: 401 }));
  });

  it("calls next with ACCESS_TOKEN_INVALID for a malformed header", () => {
    const req = mockReq({ headers: { authorization: "Basic token" } as any });
    const res = mockRes();
    const next = jest.fn();

    jwtUtils.extractBearerToken.mockReturnValue(null);
    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "ACCESS_TOKEN_INVALID", statusCode: 401 }));
  });

  it.each(["ACCESS_TOKEN_INVALID", "ACCESS_TOKEN_EXPIRED"])("preserves %s verification errors", (code) => {
    const req = mockReq({ headers: { authorization: "Bearer token" } as any });
    const res = mockRes();
    const next = jest.fn();
    const error = { code, statusCode: 401 };

    jwtUtils.extractBearerToken.mockReturnValue("token");
    jwtUtils.verifyAccessToken.mockImplementation(() => {
      throw error;
    });
    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("attaches req.user when token is valid", () => {
    const req = mockReq({ headers: { authorization: "Bearer token" } as any });
    const res = mockRes();
    const next = jest.fn();

    jwtUtils.extractBearerToken.mockReturnValue("token");
    jwtUtils.verifyAccessToken.mockReturnValue({ sub: "u1", role: "common", iat: 0, exp: 0 });

    authMiddleware(req, res, next);

    expect((req as any).user).toEqual({ id: "u1", role: "common" });
    expect(next).toHaveBeenCalledWith();
  });
});

