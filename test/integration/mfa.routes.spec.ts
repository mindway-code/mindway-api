import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { unauthorized } from "../../src/core/errors/httpError.js";

const authRateLimit = {
  default: (_req: unknown, _res: unknown, next: (error?: unknown) => void) => next(),
};
const mfaRateLimit = {
  default: jest.fn((_req: unknown, _res: unknown, next: (error?: unknown) => void) => next()),
};
const jwt = {
  signAccessToken: jest.fn<() => string>(() => "access-token"),
  extractBearerToken: (header?: string) => {
    const [type, token] = header?.split(" ") ?? [];
    return type === "Bearer" && token ? token : null;
  },
  verifyAccessToken: (token: string) => {
    if (token === "user-token") return { sub: "user-1", role: "common", iat: 0, exp: 0 };
    throw unauthorized("Invalid or expired token");
  },
};
const mfaService = {
  getMfaStatusService: jest.fn<(...args: any[]) => any>(),
  startTotpEnrollmentService: jest.fn<(...args: any[]) => any>(),
  confirmTotpEnrollmentService: jest.fn<(...args: any[]) => any>(),
  regenerateRecoveryCodesService: jest.fn<(...args: any[]) => any>(),
  disableTotpService: jest.fn<(...args: any[]) => any>(),
  issueStepUpGrantService: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule("../../src/core/middlewares/rateLimit.middleware.js", () => authRateLimit);
jest.unstable_mockModule("../../src/core/middlewares/mfaRateLimit.middleware.js", () => mfaRateLimit);
jest.unstable_mockModule("../../src/utils/crypto/jwt.js", () => jwt);
jest.unstable_mockModule("../../src/api/v1/modules/mfa/mfa.service.js", () => mfaService);

const { createApp } = await import("../../src/infra/http/app.js");

const authorization = { Authorization: "Bearer user-token" };
const enrollmentId = "00000000-0000-4000-8000-000000000001";
const anonymousCases: Array<["get" | "post" | "delete", string]> = [
  ["get", "/api/auth/mfa"],
  ["post", "/api/auth/mfa/totp/enrollments"],
  ["post", `/api/auth/mfa/totp/enrollments/${enrollmentId}/confirm`],
  ["post", "/api/auth/mfa/recovery-codes/regenerate"],
  ["delete", "/api/auth/mfa/totp"],
  ["post", "/api/auth/mfa/step-up-grants"],
];

describe("integration: MFA route boundaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mfaService.getMfaStatusService.mockResolvedValue({
      enabled: false,
      enabledAt: null,
      recoveryCodesRemaining: 0,
    });
    mfaService.startTotpEnrollmentService.mockResolvedValue({ enrollmentId });
    mfaService.confirmTotpEnrollmentService.mockResolvedValue({ recoveryCodes: ["one-time-code"] });
    mfaService.regenerateRecoveryCodesService.mockResolvedValue({ recoveryCodes: ["new-one-time-code"] });
    mfaService.disableTotpService.mockResolvedValue(undefined);
    mfaService.issueStepUpGrantService.mockResolvedValue({ grant: "opaque-proof", expiresIn: 300 });
  });

  it.each(anonymousCases)("requires authentication for %s %s", async (method, path) => {
    await request(createApp())[method](path).expect(401);
  });

  it("exposes the full validated lifecycle and invokes the MFA limiter on sensitive routes", async () => {
    await request(createApp()).get("/api/auth/mfa").set(authorization).expect(200);
    await request(createApp())
      .post("/api/auth/mfa/totp/enrollments")
      .set(authorization)
      .send({ currentPassword: "current-password" })
      .expect(200);
    await request(createApp())
      .post(`/api/auth/mfa/totp/enrollments/${enrollmentId}/confirm`)
      .set(authorization)
      .send({ code: "123456" })
      .expect(200);
    await request(createApp())
      .post("/api/auth/mfa/recovery-codes/regenerate")
      .set(authorization)
      .send({ currentPassword: "current-password", code: "123456" })
      .expect(200);
    await request(createApp())
      .delete("/api/auth/mfa/totp")
      .set(authorization)
      .send({ currentPassword: "current-password", code: "123456" })
      .expect(200);
    await request(createApp())
      .post("/api/auth/mfa/step-up-grants")
      .set(authorization)
      .send({
        method: "TOTP",
        code: "123456",
        action: "report.validate",
        resourceType: "reportRevision",
        resourceId: enrollmentId,
      })
      .expect(200);

    expect(mfaService.getMfaStatusService).toHaveBeenCalledWith("user-1");
    expect(mfaService.startTotpEnrollmentService).toHaveBeenCalledTimes(1);
    expect(mfaService.confirmTotpEnrollmentService).toHaveBeenCalledTimes(1);
    expect(mfaService.issueStepUpGrantService).toHaveBeenCalledTimes(1);
    expect(mfaService.regenerateRecoveryCodesService).toHaveBeenCalledTimes(1);
    expect(mfaService.disableTotpService).toHaveBeenCalledTimes(1);
    expect(mfaRateLimit.default).toHaveBeenCalledTimes(5);
  });

  it("rejects malformed enrollment IDs and bodies before the service", async () => {
    await request(createApp())
      .post("/api/auth/mfa/totp/enrollments/not-a-uuid/confirm")
      .set(authorization)
      .send({ code: "123" })
      .expect(400);
    await request(createApp())
      .delete("/api/auth/mfa/totp")
      .set(authorization)
      .send({ currentPassword: "", code: "1" })
      .expect(400);

    expect(mfaService.confirmTotpEnrollmentService).not.toHaveBeenCalled();
    expect(mfaService.disableTotpService).not.toHaveBeenCalled();
  });
});
