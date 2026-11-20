import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const securityStore = {
  consumeStepUpGrant: jest.fn<(...args: any[]) => any>(),
  SecurityStoreUnavailableError: class SecurityStoreUnavailableError extends Error {},
};

jest.unstable_mockModule("../../src/infra/redis/securityStore.js", () => securityStore);
const { requireStepUp } = await import("../../src/core/middlewares/requireStepUp.middleware.js");

const middleware = requireStepUp({
  action: "report.validate",
  resourceType: "reportRevision",
  getResourceId: (req) => req.body.revisionId as string,
});

function request(headers: Record<string, string> = {}) {
  return mockReq({
    method: "POST",
    headers,
    body: { revisionId: "revision-a" },
    user: { id: "user-1", role: "professional" },
  });
}

describe("requireStepUp middleware", () => {
  beforeEach(() => {
    securityStore.consumeStepUpGrant.mockReset();
  });

  it("requires a proof without calling Redis", async () => {
    const next = jest.fn();
    await middleware(request(), mockRes(), next);
    expect(securityStore.consumeStepUpGrant).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "MFA_PROOF_REQUIRED" }));
  });

  it("binds proof consumption to the user, action, resource type, revision, and idempotency key", async () => {
    securityStore.consumeStepUpGrant.mockResolvedValue({
      status: "CONSUMED",
      grant: {
        method: "TOTP",
        factorId: "factor-1",
      },
    });
    const req = request({ "x-mfa-proof": "opaque-proof", "idempotency-key": "idem-1" });
    const next = jest.fn();
    await middleware(req, mockRes(), next);

    expect(securityStore.consumeStepUpGrant).toHaveBeenCalledWith({
      token: "opaque-proof",
      userId: "user-1",
      action: "report.validate",
      resourceType: "reportRevision",
      resourceId: "revision-a",
      idempotencyKey: "idem-1",
    });
    expect(req.stepUp).toEqual({ method: "TOTP", factorId: "factor-1", idempotentReplay: false });
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ["INVALID", "MFA_PROOF_INVALID"],
    ["EXPIRED", "MFA_PROOF_EXPIRED"],
    ["ALREADY_USED", "MFA_PROOF_ALREADY_USED"],
    ["SCOPE_MISMATCH", "MFA_PROOF_SCOPE_MISMATCH"],
  ] as Array<[string, string]>)("maps %s without attaching grant context", async (status, code) => {
    securityStore.consumeStepUpGrant.mockResolvedValue({ status });
    const req = request({ "x-mfa-proof": "opaque-proof" });
    const next = jest.fn();
    await middleware(req, mockRes(), next);
    expect(req.stepUp).toBeUndefined();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code }));
  });

  it("marks only the exact idempotent replay as a retry", async () => {
    securityStore.consumeStepUpGrant.mockResolvedValue({
      status: "IDEMPOTENT_REPLAY",
      grant: { method: "RECOVERY_CODE", factorId: "factor-1" },
    });
    const req = request({ "x-mfa-proof": "opaque-proof", "idempotency-key": "idem-1" });
    const next = jest.fn();
    await middleware(req, mockRes(), next);
    expect(req.stepUp?.idempotentReplay).toBe(true);
    expect(next).toHaveBeenCalledWith();
  });

  it("fails closed when Redis is unavailable", async () => {
    securityStore.consumeStepUpGrant.mockRejectedValue(new securityStore.SecurityStoreUnavailableError());
    const next = jest.fn();
    await middleware(request({ "x-mfa-proof": "opaque-proof" }), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "MFA_SECURITY_STORE_UNAVAILABLE" }));
  });
});
