import { describe, it, expect, jest, beforeAll, beforeEach } from "@jest/globals";
import request from "supertest";

const rateLimit = {
  default: (_req: any, _res: any, next: any) => next(),
};

const authService = {
  loginService: jest.fn(async () => ({ accessToken: "access", refreshToken: "refresh" })),
  registerService: jest.fn(async () => ({ accessToken: "access", refreshToken: "refresh" })),
  refreshService: jest.fn(),
  logoutService: jest.fn(),
};

jest.unstable_mockModule("../../src/core/middlewares/rateLimit.middleware.js", () => rateLimit);
jest.unstable_mockModule("../../src/api/v1/modules/auth/auth.service.js", () => authService);

const { createApp } = await import("../../src/infra/http/app.js");

describe("integration: POST /auth/login", () => {
  beforeAll(() => {
    // Ensure deterministic env for request pipeline (mainly CORS)
    process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:4200";
  });

  beforeEach(() => {
    authService.loginService.mockClear();
    authService.registerService.mockClear();
  });

  it("returns 200 + accessToken payload", async () => {
    const app = createApp();

    const res = await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "pass" }).expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: { accessToken: "access" },
        message: "Logged in",
      }),
    );
    expect(res.headers["set-cookie"]?.[0]).toContain("refresh_token=refresh");
    expect(res.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    expect(res.headers["set-cookie"]?.[0]).toContain("SameSite=Lax");
  });

  it.each(["common", "enterprise", "professional", "therapist"])(
    "accepts the %s public registration role",
    async (role) => {
      await request(createApp())
        .post("/api/auth/register")
        .send({
          name: "Alice",
          email: "alice@example.com",
          password: "secret1",
          confirmPassword: "secret1",
          role,
        })
        .expect(200);

      expect(authService.registerService).toHaveBeenCalledWith(expect.objectContaining({ role }));
    },
  );

  it.each([undefined, "admin", "ADMIN", "unknown"])("rejects public registration role %s", async (role) => {
    const body: Record<string, unknown> = {
      name: "Alice",
      email: "alice@example.com",
      password: "secret1",
      confirmPassword: "secret1",
    };
    if (role !== undefined) body.role = role;

    await request(createApp()).post("/api/auth/register").send(body).expect(400);
    expect(authService.registerService).not.toHaveBeenCalled();
  });

  it("rejects server-controlled or unsupported registration fields", async () => {
    await request(createApp())
      .post("/api/auth/register")
      .send({
        name: "Alice",
        email: "alice@example.com",
        password: "secret1",
        confirmPassword: "secret1",
        role: "common",
        provider: "google",
      })
      .expect(400);
    expect(authService.registerService).not.toHaveBeenCalled();
  });
});
