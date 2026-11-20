import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { makeMfaServices } from "../../../src/api/v1/modules/mfa/mfa.service.js";
import {
  mfaError,
  passwordReauthenticationUnsupported,
} from "../../../src/core/errors/httpError.js";
import { SecurityStoreUnavailableError } from "../../../src/infra/redis/securityStore.js";

const encryptedSecret = { ciphertext: "ciphertext", iv: "iv", authTag: "tag", keyVersion: 1 };
const factor = {
  id: "factor-1",
  userId: "user-1",
  ...encryptedSecret,
  lastUsedTimeStep: null,
  enabledAt: new Date("2026-01-01T00:00:00.000Z"),
};

function makeDeps() {
  return {
    env: {
      MFA_ISSUER: "MINDWAY",
      MFA_TOTP_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString("base64"),
      MFA_TOTP_ENCRYPTION_KEY_VERSION: 1,
      MFA_RECOVERY_CODE_PEPPER: "test-recovery-pepper-that-is-long-enough",
      MFA_ENROLLMENT_TTL_SECONDS: 600,
      MFA_ATTEMPT_WINDOW_SECONDS: 300,
      MFA_ATTEMPT_MAX: 5,
      MFA_STEP_UP_TTL_SECONDS: 300,
    },
    mfaError,
    passwordReauthenticationUnsupported,
    findAuthUserByIdForPassword: jest.fn<(...args: any[]) => any>().mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      role: "common",
      provider: "local",
      googleId: null,
      passwordHash: "password-hash",
    }),
    verifyPassword: jest.fn<(...args: any[]) => any>().mockResolvedValue(true),
    getMfaStatus: jest.fn<(...args: any[]) => any>().mockResolvedValue({ enabled: false, enabledAt: null, recoveryCodesRemaining: 0 }),
    findTotpFactorByUserId: jest.fn<(...args: any[]) => any>().mockResolvedValue(null),
    createTotpFactorWithRecoveryCodes: jest.fn<(...args: any[]) => any>().mockResolvedValue({ id: "factor-1" }),
    listUnusedRecoveryCodes: jest.fn<(...args: any[]) => any>().mockResolvedValue([]),
    replaceRecoveryCodes: jest.fn<(...args: any[]) => any>().mockResolvedValue(true),
    deleteTotpFactor: jest.fn<(...args: any[]) => any>().mockResolvedValue(true),
    consumeMfaAssertion: jest.fn<(...args: any[]) => any>().mockResolvedValue(true),
    createSecurityAuditEvent: jest.fn<(...args: any[]) => any>().mockResolvedValue(undefined),
    storePendingEnrollment: jest.fn<(...args: any[]) => any>().mockResolvedValue(undefined),
    loadPendingEnrollment: jest.fn<(...args: any[]) => any>().mockResolvedValue({ userId: "user-1", encryptedSecret }),
    deletePendingEnrollment: jest.fn<(...args: any[]) => any>().mockResolvedValue(undefined),
    incrementFailedAttempt: jest.fn<(...args: any[]) => any>().mockResolvedValue(1),
    clearFailedAttempts: jest.fn<(...args: any[]) => any>().mockResolvedValue(undefined),
    issueStepUpGrant: jest.fn<(...args: any[]) => any>().mockResolvedValue("opaque-proof"),
    generateTotpSecret: jest.fn(() => "MANUALBASE32SECRET"),
    buildTotpUri: jest.fn(() => "otpauth://local-only-uri"),
    verifyTotpCode: jest.fn<(...args: any[]) => any>().mockReturnValue({ valid: true, matchedTimeStep: 100 }),
    encryptSecret: jest.fn(() => encryptedSecret),
    decryptSecret: jest.fn(() => "MANUALBASE32SECRET"),
    generateRecoveryCodes: jest.fn(() => ["AAAAA-BBBBB-CCCCC-DDDDD"]),
    digestRecoveryCode: jest.fn(() => "digest"),
    findMatchingRecoveryCodeId: jest.fn<(...args: any[]) => any>().mockReturnValue(null),
    randomUUID: jest.fn(() => "00000000-0000-4000-8000-000000000001"),
  };
}

describe("MFA services", () => {
  let deps: ReturnType<typeof makeDeps>;

  beforeEach(() => {
    deps = makeDeps();
  });

  it("starts a user-bound encrypted enrollment after password reauthentication", async () => {
    const service = makeMfaServices(deps as any);
    const result = await service.startTotpEnrollmentService({
      userId: "user-1",
      ip: "127.0.0.1",
      dto: { currentPassword: "current-password" },
    });

    expect(result).toEqual({
      enrollmentId: "00000000-0000-4000-8000-000000000001",
      manualSecret: "MANUALBASE32SECRET",
      otpauthUri: "otpauth://local-only-uri",
      expiresInSeconds: 600,
    });
    expect(deps.storePendingEnrollment).toHaveBeenCalledWith(
      result.enrollmentId,
      { userId: "user-1", encryptedSecret },
      600,
    );
    expect(JSON.stringify(deps.storePendingEnrollment.mock.calls[0])).not.toContain("MANUALBASE32SECRET");
  });

  it("rejects Google-only password reauthentication", async () => {
    deps.findAuthUserByIdForPassword.mockResolvedValue({ provider: "google", passwordHash: null });
    const service = makeMfaServices(deps as any);
    await expect(
      service.startTotpEnrollmentService({ userId: "user-1", ip: "ip", dto: { currentPassword: "x" } }),
    ).rejects.toMatchObject({ code: "PASSWORD_REAUTHENTICATION_UNSUPPORTED" });
  });

  it("fails closed when Redis cannot store security state", async () => {
    deps.storePendingEnrollment.mockRejectedValue(new SecurityStoreUnavailableError());
    const service = makeMfaServices(deps as any);
    await expect(
      service.startTotpEnrollmentService({ userId: "user-1", ip: "ip", dto: { currentPassword: "x" } }),
    ).rejects.toMatchObject({ code: "MFA_SECURITY_STORE_UNAVAILABLE", statusCode: 503 });
  });

  it.each([
    { pending: null, userId: "user-1" },
    { pending: { userId: "another-user", encryptedSecret }, userId: "user-1" },
  ])("rejects expired or foreign enrollment without revealing ownership", async ({ pending, userId }) => {
    deps.loadPendingEnrollment.mockResolvedValue(pending);
    const service = makeMfaServices(deps as any);
    await expect(
      service.confirmTotpEnrollmentService({
        userId,
        ip: "ip",
        enrollmentId: "enrollment-1",
        dto: { code: "123456" },
      }),
    ).rejects.toMatchObject({ code: "MFA_ENROLLMENT_EXPIRED" });
  });

  it("confirms enrollment transactionally and returns recovery codes once", async () => {
    const service = makeMfaServices(deps as any);
    const result = await service.confirmTotpEnrollmentService({
      userId: "user-1",
      ip: "ip",
      enrollmentId: "enrollment-1",
      dto: { code: "123456" },
    });

    expect(deps.createTotpFactorWithRecoveryCodes.mock.invocationCallOrder[0]!).toBeLessThan(
      deps.deletePendingEnrollment.mock.invocationCallOrder[0]!,
    );
    expect(deps.createTotpFactorWithRecoveryCodes).toHaveBeenCalledWith({
      userId: "user-1",
      encryptedSecret,
      initialTimeStep: 100n,
      recoveryCodeDigests: ["digest"],
    });
    expect(result).toEqual({ recoveryCodes: ["AAAAA-BBBBB-CCCCC-DDDDD"] });
  });

  it("enforces the failed-attempt limit", async () => {
    deps.verifyTotpCode.mockReturnValue({ valid: false });
    deps.incrementFailedAttempt.mockResolvedValue(5);
    const service = makeMfaServices(deps as any);
    await expect(
      service.confirmTotpEnrollmentService({
        userId: "user-1",
        ip: "ip",
        enrollmentId: "enrollment-1",
        dto: { code: "123456" },
      }),
    ).rejects.toMatchObject({ code: "MFA_RATE_LIMITED", statusCode: 429 });
  });

  it("rejects a reused TOTP time step", async () => {
    deps.findTotpFactorByUserId.mockResolvedValue({ ...factor, lastUsedTimeStep: 100n });
    deps.verifyTotpCode.mockReturnValue({ valid: true, matchedTimeStep: 100 });
    const service = makeMfaServices(deps as any);
    await expect(
      service.regenerateRecoveryCodesService({
        userId: "user-1",
        ip: "ip",
        dto: { currentPassword: "current-password", code: "123456" },
      }),
    ).rejects.toMatchObject({ code: "MFA_CODE_REUSED" });
    expect(deps.replaceRecoveryCodes).not.toHaveBeenCalled();
  });

  it("consumes a recovery code once while regenerating codes", async () => {
    deps.findTotpFactorByUserId.mockResolvedValue(factor);
    deps.listUnusedRecoveryCodes
      .mockResolvedValueOnce([{ id: "recovery-1", digest: "digest" }])
      .mockResolvedValueOnce([]);
    deps.findMatchingRecoveryCodeId
      .mockReturnValueOnce("recovery-1")
      .mockReturnValueOnce(null);
    const service = makeMfaServices(deps as any);
    const dto = { currentPassword: "current-password", code: "AAAAA-BBBBB-CCCCC-DDDDD" };

    await expect(service.regenerateRecoveryCodesService({ userId: "user-1", ip: "ip", dto })).resolves.toEqual({
      recoveryCodes: ["AAAAA-BBBBB-CCCCC-DDDDD"],
    });
    await expect(
      service.regenerateRecoveryCodesService({ userId: "user-1", ip: "ip", dto }),
    ).rejects.toMatchObject({ code: "MFA_RECOVERY_CODE_INVALID" });
    expect(deps.replaceRecoveryCodes).toHaveBeenCalledWith(
      expect.objectContaining({ assertion: { type: "recovery", recoveryCodeId: "recovery-1" } }),
    );
  });

  it("never includes protected material in public errors", async () => {
    deps.verifyTotpCode.mockReturnValue({ valid: false });
    const service = makeMfaServices(deps as any);
    let caught: unknown;
    try {
      await service.confirmTotpEnrollmentService({
        userId: "user-1",
        ip: "ip",
        enrollmentId: "enrollment-1",
        dto: { code: "123456" },
      });
    } catch (error) {
      caught = error;
    }
    const serialized = JSON.stringify(caught);
    expect(serialized).not.toContain("123456");
    expect(serialized).not.toContain("MANUALBASE32SECRET");
    expect(serialized).not.toContain("otpauth://");
  });

  it("consumes the matched TOTP step before issuing a five-minute revision-scoped grant", async () => {
    deps.findTotpFactorByUserId.mockResolvedValue(factor);
    const service = makeMfaServices(deps as any);
    const result = await service.issueStepUpGrantService({
      userId: "user-1",
      ip: "127.0.0.1",
      requestId: "request-1",
      dto: {
        method: "TOTP",
        code: "123456",
        action: "report.validate",
        resourceType: "reportRevision",
        resourceId: "revision-1",
      },
    });

    expect(result).toEqual({ grant: "opaque-proof", expiresIn: 300 });
    expect(deps.consumeMfaAssertion).toHaveBeenCalledWith({
      factorId: "factor-1",
      assertion: { type: "totp", timeStep: 100n },
    });
    expect(deps.consumeMfaAssertion.mock.invocationCallOrder[0]!).toBeLessThan(
      deps.issueStepUpGrant.mock.invocationCallOrder[0]!,
    );
    expect(deps.issueStepUpGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        action: "report.validate",
        resourceType: "reportRevision",
        resourceId: "revision-1",
        method: "TOTP",
        factorId: "factor-1",
      }),
      300,
    );
    expect(deps.createSecurityAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "MFA_STEP_UP_GRANT_ISSUED",
      outcome: "SUCCESS",
      resourceId: "revision-1",
    }));
    expect(JSON.stringify(deps.createSecurityAuditEvent.mock.calls)).not.toContain("123456");
    expect(JSON.stringify(deps.createSecurityAuditEvent.mock.calls)).not.toContain("opaque-proof");
  });

  it("does not issue a grant when the TOTP step loses an atomic reuse race", async () => {
    deps.findTotpFactorByUserId.mockResolvedValue(factor);
    deps.consumeMfaAssertion.mockResolvedValue(false);
    const service = makeMfaServices(deps as any);

    await expect(service.issueStepUpGrantService({
      userId: "user-1",
      ip: "127.0.0.1",
      requestId: "request-1",
      dto: {
        method: "TOTP",
        code: "123456",
        action: "report.validate",
        resourceType: "reportRevision",
        resourceId: "revision-1",
      },
    })).rejects.toMatchObject({ code: "MFA_CODE_REUSED" });
    expect(deps.issueStepUpGrant).not.toHaveBeenCalled();
    expect(deps.createSecurityAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "MFA_STEP_UP_GRANT_FAILED",
      outcome: "FAILURE",
    }));
  });
});
