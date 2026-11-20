import type { Prisma } from "@prisma/client";
import type {
  MfaCodeAssertion,
  MfaStatus,
  RecoveryCodeRecord,
  TotpFactorRecord,
} from "../../../api/v1/modules/mfa/mfa.types.js";
import type { EncryptedSecret } from "../../../utils/crypto/secretEncryption.js";
import { prisma } from "../prisma/client.js";

const factorSecretSelect = {
  id: true,
  userId: true,
  secretCiphertext: true,
  secretIv: true,
  secretAuthTag: true,
  keyVersion: true,
  lastUsedTimeStep: true,
  enabledAt: true,
} as const;

function toFactorRecord(record: {
  id: string;
  userId: string;
  secretCiphertext: string;
  secretIv: string;
  secretAuthTag: string;
  keyVersion: number;
  lastUsedTimeStep: bigint | null;
  enabledAt: Date;
}): TotpFactorRecord {
  return {
    id: record.id,
    userId: record.userId,
    ciphertext: record.secretCiphertext,
    iv: record.secretIv,
    authTag: record.secretAuthTag,
    keyVersion: record.keyVersion,
    lastUsedTimeStep: record.lastUsedTimeStep,
    enabledAt: record.enabledAt,
  };
}

async function consumeAssertion(
  transaction: Prisma.TransactionClient,
  factorId: string,
  assertion: MfaCodeAssertion,
): Promise<boolean> {
  if (assertion.type === "totp") {
    const result = await transaction.userTotpFactor.updateMany({
      where: {
        id: factorId,
        OR: [
          { lastUsedTimeStep: null },
          { lastUsedTimeStep: { lt: assertion.timeStep } },
        ],
      },
      data: { lastUsedTimeStep: assertion.timeStep },
    });
    return result.count === 1;
  }

  const result = await transaction.mfaRecoveryCode.updateMany({
    where: { id: assertion.recoveryCodeId, factorId, usedAt: null },
    data: { usedAt: new Date() },
  });
  return result.count === 1;
}

export async function getMfaStatus(userId: string): Promise<MfaStatus> {
  const factor = await prisma.userTotpFactor.findUnique({
    where: { userId },
    select: { id: true, enabledAt: true },
  });
  if (!factor) return { enabled: false, enabledAt: null, recoveryCodesRemaining: 0 };

  const recoveryCodesRemaining = await prisma.mfaRecoveryCode.count({
    where: { factorId: factor.id, usedAt: null },
  });
  return { enabled: true, enabledAt: factor.enabledAt, recoveryCodesRemaining };
}

export async function findTotpFactorByUserId(userId: string): Promise<TotpFactorRecord | null> {
  const factor = await prisma.userTotpFactor.findUnique({
    where: { userId },
    select: factorSecretSelect,
  });
  return factor ? toFactorRecord(factor) : null;
}

export async function createTotpFactorWithRecoveryCodes(params: {
  userId: string;
  encryptedSecret: EncryptedSecret;
  initialTimeStep: bigint;
  recoveryCodeDigests: string[];
}): Promise<{ id: string }> {
  return prisma.$transaction(async (transaction) =>
    transaction.userTotpFactor.create({
      data: {
        userId: params.userId,
        secretCiphertext: params.encryptedSecret.ciphertext,
        secretIv: params.encryptedSecret.iv,
        secretAuthTag: params.encryptedSecret.authTag,
        keyVersion: params.encryptedSecret.keyVersion,
        lastUsedTimeStep: params.initialTimeStep,
        recoveryCodes: {
          createMany: { data: params.recoveryCodeDigests.map((digest) => ({ digest })) },
        },
      },
      select: { id: true },
    }),
  );
}

export async function listUnusedRecoveryCodes(factorId: string): Promise<RecoveryCodeRecord[]> {
  return prisma.mfaRecoveryCode.findMany({
    where: { factorId, usedAt: null },
    select: { id: true, digest: true },
  });
}

export async function replaceRecoveryCodes(params: {
  factorId: string;
  assertion: MfaCodeAssertion;
  recoveryCodeDigests: string[];
}): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    if (!(await consumeAssertion(transaction, params.factorId, params.assertion))) return false;
    await transaction.mfaRecoveryCode.deleteMany({ where: { factorId: params.factorId } });
    await transaction.mfaRecoveryCode.createMany({
      data: params.recoveryCodeDigests.map((digest) => ({ factorId: params.factorId, digest })),
    });
    return true;
  });
}

export async function deleteTotpFactor(params: {
  factorId: string;
  assertion: MfaCodeAssertion;
}): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    if (!(await consumeAssertion(transaction, params.factorId, params.assertion))) return false;
    await transaction.userTotpFactor.delete({ where: { id: params.factorId } });
    return true;
  });
}

export async function consumeMfaAssertion(params: {
  factorId: string;
  assertion: MfaCodeAssertion;
}): Promise<boolean> {
  return prisma.$transaction((transaction) =>
    consumeAssertion(transaction, params.factorId, params.assertion),
  );
}

export default {
  getMfaStatus,
  findTotpFactorByUserId,
  createTotpFactorWithRecoveryCodes,
  listUnusedRecoveryCodes,
  replaceRecoveryCodes,
  deleteTotpFactor,
  consumeMfaAssertion,
};
