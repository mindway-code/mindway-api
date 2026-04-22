import { describe, it, expect, jest, beforeAll } from "@jest/globals";
import request from "supertest";

const rateLimit = {
  default: (_req: any, _res: any, next: any) => next(),
};

const authService = {
  loginService: jest.fn(async () => ({ accessToken: "access", refreshToken: "refresh" })),
  registerService: jest.fn(),
  refreshService: jest.fn(),
  logoutService: jest.fn(),
};

const cookie = {
  setRefreshCookie: jest.fn(),
  clearRefreshCookie: jest.fn(),
};

jest.unstable_mockModule("../../src/core/middlewares/rateLimit.middleware.js", () => rateLimit);
jest.unstable_mockModule("../../src/api/v1/modules/auth/auth.service.js", () => authService);
jest.unstable_mockModule("../../src/utils/tokens/cookie.js", () => cookie);

const { createApp } = await import("../../src/infra/http/app.js");

describe("integration: POST /auth/login", () => {
  beforeAll(() => {
    // Ensure deterministic env for request pipeline (mainly CORS)
    process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:4200";
  });

  it("returns 200 + accessToken payload", async () => {
    const app = createApp();

    const res = await request(app).post("/auth/login").send({ email: "a@a.com", password: "pass" }).expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: { accessToken: "access" },
        message: "Logged in",
      }),
    );
  });
});
