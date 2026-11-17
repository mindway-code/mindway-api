import type { EncryptedSecret } from "../../../../utils/crypto/secretEncryption.js";

export type MfaStatus = {
  enabled: boolean;
  enabledAt: Date | null;
  recoveryCodesRemaining: number;
};

export type TotpFactorRecord = EncryptedSecret & {
  id: string;
  userId: string;
  lastUsedTimeStep: bigint | null;
  enabledAt: Date;
};

export type RecoveryCodeRecord = {
  id: string;
  digest: string;
};

export type MfaCodeAssertion =
  | { type: "totp"; timeStep: bigint }
  | { type: "recovery"; recoveryCodeId: string };

export type StartTotpEnrollmentDTO = {
  currentPassword: string;
};

export type ConfirmTotpEnrollmentDTO = {
  code: string;
};

export type MfaProtectedActionDTO = {
  currentPassword: string;
  code: string;
};
