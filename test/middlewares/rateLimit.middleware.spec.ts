import { describe, it, expect, jest } from "@jest/globals";

describe("middlewares: rateLimit", () => {
  it("exports a limiter whose handler calls next(tooManyRequests)", async () => {
    jest.resetModules();

    const rateLimit = jest.fn((opts: any) => opts);
    const env = { AUTH_RATE_LIMIT_WINDOW_MS: 1000, AUTH_RATE_LIMIT_MAX: 1, LOG_LEVEL: "info" };

    jest.unstable_mockModule("express-rate-limit", () => ({ default: rateLimit }));
    jest.unstable_mockModule("../../src/core/config/env.js", () => ({ env }));

    const mod = await import("../../src/core/middlewares/rateLimit.middleware.js");

    expect(rateLimit).toHaveBeenCalledTimes(1);
    const limiter = mod.authRateLimiter as any;
    const next = jest.fn();
    limiter.handler({} as any, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "TOO_MANY_REQUESTS", statusCode: 429 }));
  });
});

