import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const securityStore = {
  getFailedAttemptCount: jest.fn<(...args: any[]) => any>(),
  SecurityStoreUnavailableError: class SecurityStoreUnavailableError extends Error {},
};

jest.unstable_mockModule("../../src/infra/redis/securityStore.js", () => securityStore);

const { mfaRateLimitMiddleware } = await import(
  "../../src/core/middlewares/mfaRateLimit.middleware.js"
);

describe("MFA rate-limit middleware", () => {
  beforeEach(() => {
    securityStore.getFailedAttemptCount.mockReset();
  });

  it("allows attempts below the temporary limit", async () => {
    securityStore.getFailedAttemptCount.mockResolvedValue(4);
    const req = mockReq({ user: { id: "user-1", role: "common" } as any, ip: "127.0.0.1" });
    const next = jest.fn();
    await mfaRateLimitMiddleware(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects attempts at the temporary limit", async () => {
    securityStore.getFailedAttemptCount.mockResolvedValue(5);
    const req = mockReq({ user: { id: "user-1", role: "common" } as any, ip: "127.0.0.1" });
    const next = jest.fn();
    await mfaRateLimitMiddleware(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "MFA_RATE_LIMITED", statusCode: 429 }));
  });

  it("fails closed when Redis is unavailable", async () => {
    securityStore.getFailedAttemptCount.mockRejectedValue(new securityStore.SecurityStoreUnavailableError());
    const req = mockReq({ user: { id: "user-1", role: "common" } as any, ip: "127.0.0.1" });
    const next = jest.fn();
    await mfaRateLimitMiddleware(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: "MFA_SECURITY_STORE_UNAVAILABLE", statusCode: 503 }),
    );
  });
});
