import { randomUUID } from "node:crypto";
import { env } from "../../../../core/config/env.js";
import {
  mfaError,
  passwordReauthenticationUnsupported,
  type HttpError,
} from "../../../../core/errors/httpError.js";
import {
  createTotpFactorWithRecoveryCodes,
  deleteTotpFactor,
  findTotpFactorByUserId,
  getMfaStatus,
  listUnusedRecoveryCodes,
  replaceRecoveryCodes,
} from "../../../../infra/database/repositories/mfa.repository.js";
import { findAuthUserByIdForPassword } from "../../../../infra/database/repositories/auth.repository.js";
import {
  clearFailedAttempts,
  deletePendingEnrollment,
  incrementFailedAttempt,
  loadPendingEnrollment,
  SecurityStoreUnavailableError,
  storePendingEnrollment,
} from "../../../../infra/redis/securityStore.js";
import {
  decryptSecret,
  encryptSecret,
} from "../../../../utils/crypto/secretEncryption.js";
import { verifyPassword } from "../../../../utils/crypto/hash.js";
import {
  digestRecoveryCode,
  findMatchingRecoveryCodeId,
  generateRecoveryCodes,
  normalizeRecoveryCode,
} from "../../../../utils/crypto/recoveryCodes.js";
import {
  buildTotpUri,
  generateTotpSecret,
  verifyTotpCode,
} from "../../../../utils/crypto/totp.js";
import type {
  ConfirmTotpEnrollmentDTO,
  MfaCodeAssertion,
  MfaProtectedActionDTO,
  StartTotpEnrollmentDTO,
  TotpFactorRecord,
} from "./mfa.types.js";

type MfaEnv = Pick<
  typeof env,
  | "MFA_ISSUER"
  | "MFA_TOTP_ENCRYPTION_KEY"
  | "MFA_TOTP_ENCRYPTION_KEY_VERSION"
  | "MFA_RECOVERY_CODE_PEPPER"
  | "MFA_ENROLLMENT_TTL_SECONDS"
  | "MFA_ATTEMPT_WINDOW_SECONDS"
  | "MFA_ATTEMPT_MAX"
>;

export type MfaServiceDeps = {
  env: MfaEnv;
  mfaError: typeof mfaError;
  passwordReauthenticationUnsupported: typeof passwordReauthenticationUnsupported;
  findAuthUserByIdForPassword: typeof findAuthUserByIdForPassword;
  verifyPassword: typeof verifyPassword;
  getMfaStatus: typeof getMfaStatus;
  findTotpFactorByUserId: typeof findTotpFactorByUserId;
  createTotpFactorWithRecoveryCodes: typeof createTotpFactorWithRecoveryCodes;
  listUnusedRecoveryCodes: typeof listUnusedRecoveryCodes;
  replaceRecoveryCodes: typeof replaceRecoveryCodes;
  deleteTotpFactor: typeof deleteTotpFactor;
  storePendingEnrollment: typeof storePendingEnrollment;
  loadPendingEnrollment: typeof loadPendingEnrollment;
  deletePendingEnrollment: typeof deletePendingEnrollment;
  incrementFailedAttempt: typeof incrementFailedAttempt;
  clearFailedAttempts: typeof clearFailedAttempts;
  generateTotpSecret: typeof generateTotpSecret;
  buildTotpUri: typeof buildTotpUri;
  verifyTotpCode: typeof verifyTotpCode;
  encryptSecret: typeof encryptSecret;
  decryptSecret: typeof decryptSecret;
  generateRecoveryCodes: typeof generateRecoveryCodes;
  digestRecoveryCode: typeof digestRecoveryCode;
  findMatchingRecoveryCodeId: typeof findMatchingRecoveryCodeId;
  randomUUID: typeof randomUUID;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

export function makeMfaServices(deps: MfaServiceDeps) {
  const encryptionKey = Buffer.from(deps.env.MFA_TOTP_ENCRYPTION_KEY, "base64");

  function securityStoreUnavailable(): HttpError {
    return deps.mfaError({
      code: "MFA_SECURITY_STORE_UNAVAILABLE",
      statusCode: 503,
      message: "MFA security state is temporarily unavailable",
    });
  }

  async function securityOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof SecurityStoreUnavailableError) throw securityStoreUnavailable();
      throw error;
    }
  }

  async function recordFailedAttempt(userId: string, ip: string): Promise<void> {
    const attempts = await securityOperation(() =>
      deps.incrementFailedAttempt(userId, ip, deps.env.MFA_ATTEMPT_WINDOW_SECONDS),
    );
    if (attempts >= deps.env.MFA_ATTEMPT_MAX) {
      throw deps.mfaError({
        code: "MFA_RATE_LIMITED",
        statusCode: 429,
        message: "Too many MFA attempts. Try again later",
      });
    }
  }

  async function clearAttempts(userId: string, ip: string): Promise<void> {
    await securityOperation(() => deps.clearFailedAttempts(userId, ip));
  }

  async function verifyCurrentPassword(
    userId: string,
    currentPassword: string,
    ip: string,
  ): Promise<{ email: string | null }> {
    const user = await deps.findAuthUserByIdForPassword(userId);
    if (user?.provider === "google" || (user && !user.passwordHash)) {
      throw deps.passwordReauthenticationUnsupported();
    }
    if (!user?.passwordHash || !(await deps.verifyPassword(currentPassword, user.passwordHash))) {
      await recordFailedAttempt(userId, ip);
      throw deps.mfaError({
        code: "MFA_REAUTHENTICATION_REQUIRED",
        statusCode: 401,
        message: "Password reauthentication failed",
      });
    }
    return { email: user.email };
  }

  function decryptFactorSecret(factor: TotpFactorRecord): string {
    if (factor.keyVersion !== deps.env.MFA_TOTP_ENCRYPTION_KEY_VERSION) {
      throw new Error("Unsupported MFA encryption key version");
    }
    return deps.decryptSecret({ encrypted: factor, key: encryptionKey });
  }

  async function verifyMfaAssertion(params: {
    factor: TotpFactorRecord;
    code: string;
    userId: string;
    ip: string;
  }): Promise<MfaCodeAssertion> {
    if (/^\d{6}$/.test(params.code)) {
      const verification = deps.verifyTotpCode({
        secret: decryptFactorSecret(params.factor),
        code: params.code,
      });
      if (!verification.valid) {
        await recordFailedAttempt(params.userId, params.ip);
        throw deps.mfaError({ code: "MFA_CODE_INVALID", statusCode: 401, message: "MFA code is invalid" });
      }

      const timeStep = BigInt(verification.matchedTimeStep);
      if (params.factor.lastUsedTimeStep !== null && timeStep <= params.factor.lastUsedTimeStep) {
        await recordFailedAttempt(params.userId, params.ip);
        throw deps.mfaError({ code: "MFA_CODE_REUSED", statusCode: 409, message: "MFA code was already used" });
      }
      return { type: "totp", timeStep };
    }

    const normalized = normalizeRecoveryCode(params.code);
    if (!/^[A-F0-9]{20}$/.test(normalized)) {
      await recordFailedAttempt(params.userId, params.ip);
      throw deps.mfaError({
        code: "MFA_RECOVERY_CODE_INVALID",
        statusCode: 401,
        message: "Recovery code is invalid",
      });
    }

    const candidates = await deps.listUnusedRecoveryCodes(params.factor.id);
    const recoveryCodeId = deps.findMatchingRecoveryCodeId({
      code: params.code,
      pepper: deps.env.MFA_RECOVERY_CODE_PEPPER,
      candidates,
    });
    if (!recoveryCodeId) {
      await recordFailedAttempt(params.userId, params.ip);
      throw deps.mfaError({
        code: "MFA_RECOVERY_CODE_INVALID",
        statusCode: 401,
        message: "Recovery code is invalid",
      });
    }
    return { type: "recovery", recoveryCodeId };
  }

  async function getMfaStatusService(userId: string) {
    return deps.getMfaStatus(userId);
  }

  async function startTotpEnrollmentService(params: {
    userId: string;
    ip: string;
    dto: StartTotpEnrollmentDTO;
  }) {
    if (await deps.findTotpFactorByUserId(params.userId)) {
      throw deps.mfaError({
        code: "MFA_ALREADY_CONFIGURED",
        statusCode: 409,
        message: "MFA is already configured",
      });
    }

    const user = await verifyCurrentPassword(params.userId, params.dto.currentPassword, params.ip);
    const secret = deps.generateTotpSecret();
    const enrollmentId = deps.randomUUID();
    const encryptedSecret = deps.encryptSecret({
      secret,
      key: encryptionKey,
      keyVersion: deps.env.MFA_TOTP_ENCRYPTION_KEY_VERSION,
    });

    await securityOperation(() =>
      deps.storePendingEnrollment(
        enrollmentId,
        { userId: params.userId, encryptedSecret },
        deps.env.MFA_ENROLLMENT_TTL_SECONDS,
      ),
    );
    await clearAttempts(params.userId, params.ip);

    return {
      enrollmentId,
      manualSecret: secret,
      otpauthUri: deps.buildTotpUri({
        issuer: deps.env.MFA_ISSUER,
        accountName: user.email ?? params.userId,
        secret,
      }),
      expiresInSeconds: deps.env.MFA_ENROLLMENT_TTL_SECONDS,
    };
  }

  async function confirmTotpEnrollmentService(params: {
    userId: string;
    ip: string;
    enrollmentId: string;
    dto: ConfirmTotpEnrollmentDTO;
  }) {
    const pending = await securityOperation(() => deps.loadPendingEnrollment(params.enrollmentId));
    if (!pending || pending.userId !== params.userId) {
      throw deps.mfaError({
        code: "MFA_ENROLLMENT_EXPIRED",
        statusCode: 410,
        message: "MFA enrollment is invalid or expired",
      });
    }
    if (await deps.findTotpFactorByUserId(params.userId)) {
      throw deps.mfaError({ code: "MFA_ALREADY_CONFIGURED", statusCode: 409, message: "MFA is already configured" });
    }

    const secret = deps.decryptSecret({ encrypted: pending.encryptedSecret, key: encryptionKey });
    const verification = deps.verifyTotpCode({ secret, code: params.dto.code });
    if (!verification.valid) {
      await recordFailedAttempt(params.userId, params.ip);
      throw deps.mfaError({ code: "MFA_CODE_INVALID", statusCode: 401, message: "MFA code is invalid" });
    }

    const recoveryCodes = deps.generateRecoveryCodes();
    const recoveryCodeDigests = recoveryCodes.map((code) =>
      deps.digestRecoveryCode(code, deps.env.MFA_RECOVERY_CODE_PEPPER),
    );

    try {
      await deps.createTotpFactorWithRecoveryCodes({
        userId: params.userId,
        encryptedSecret: pending.encryptedSecret,
        initialTimeStep: BigInt(verification.matchedTimeStep),
        recoveryCodeDigests,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw deps.mfaError({ code: "MFA_ALREADY_CONFIGURED", statusCode: 409, message: "MFA is already configured" });
      }
      throw error;
    }
    await securityOperation(() => deps.deletePendingEnrollment(params.enrollmentId));
    await clearAttempts(params.userId, params.ip);
    return { recoveryCodes };
  }

  async function regenerateRecoveryCodesService(params: {
    userId: string;
    ip: string;
    dto: MfaProtectedActionDTO;
  }) {
    const factor = await deps.findTotpFactorByUserId(params.userId);
    if (!factor) {
      throw deps.mfaError({ code: "MFA_NOT_CONFIGURED", statusCode: 409, message: "MFA is not configured" });
    }
    await verifyCurrentPassword(params.userId, params.dto.currentPassword, params.ip);
    const assertion = await verifyMfaAssertion({ factor, code: params.dto.code, userId: params.userId, ip: params.ip });
    const recoveryCodes = deps.generateRecoveryCodes();
    const recoveryCodeDigests = recoveryCodes.map((code) =>
      deps.digestRecoveryCode(code, deps.env.MFA_RECOVERY_CODE_PEPPER),
    );
    const updated = await deps.replaceRecoveryCodes({ factorId: factor.id, assertion, recoveryCodeDigests });
    if (!updated) {
      throw deps.mfaError({
        code: assertion.type === "totp" ? "MFA_CODE_REUSED" : "MFA_RECOVERY_CODE_INVALID",
        statusCode: assertion.type === "totp" ? 409 : 401,
        message: "MFA code could not be consumed",
      });
    }
    await clearAttempts(params.userId, params.ip);
    return { recoveryCodes };
  }

  async function disableTotpService(params: {
    userId: string;
    ip: string;
    dto: MfaProtectedActionDTO;
  }): Promise<void> {
    const factor = await deps.findTotpFactorByUserId(params.userId);
    if (!factor) {
      throw deps.mfaError({ code: "MFA_NOT_CONFIGURED", statusCode: 409, message: "MFA is not configured" });
    }
    await verifyCurrentPassword(params.userId, params.dto.currentPassword, params.ip);
    const assertion = await verifyMfaAssertion({ factor, code: params.dto.code, userId: params.userId, ip: params.ip });
    const deleted = await deps.deleteTotpFactor({ factorId: factor.id, assertion });
    if (!deleted) {
      throw deps.mfaError({
        code: assertion.type === "totp" ? "MFA_CODE_REUSED" : "MFA_RECOVERY_CODE_INVALID",
        statusCode: assertion.type === "totp" ? 409 : 401,
        message: "MFA code could not be consumed",
      });
    }
    await clearAttempts(params.userId, params.ip);
  }

  return {
    getMfaStatusService,
    startTotpEnrollmentService,
    confirmTotpEnrollmentService,
    regenerateRecoveryCodesService,
    disableTotpService,
  };
}

const defaultDeps: MfaServiceDeps = {
  env,
  mfaError,
  passwordReauthenticationUnsupported,
  findAuthUserByIdForPassword,
  verifyPassword,
  getMfaStatus,
  findTotpFactorByUserId,
  createTotpFactorWithRecoveryCodes,
  listUnusedRecoveryCodes,
  replaceRecoveryCodes,
  deleteTotpFactor,
  storePendingEnrollment,
  loadPendingEnrollment,
  deletePendingEnrollment,
  incrementFailedAttempt,
  clearFailedAttempts,
  generateTotpSecret,
  buildTotpUri,
  verifyTotpCode,
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes,
  digestRecoveryCode,
  findMatchingRecoveryCodeId,
  randomUUID,
};

export const {
  getMfaStatusService,
  startTotpEnrollmentService,
  confirmTotpEnrollmentService,
  regenerateRecoveryCodesService,
  disableTotpService,
} = makeMfaServices(defaultDeps);
