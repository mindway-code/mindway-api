import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fileURLToPath } from "node:url";

const transaction = {
  userTotpFactor: {
    create: jest.fn<(...args: any[]) => any>(),
    updateMany: jest.fn<(...args: any[]) => any>(),
    delete: jest.fn<(...args: any[]) => any>(),
  },
  mfaRecoveryCode: {
    updateMany: jest.fn<(...args: any[]) => any>(),
    deleteMany: jest.fn<(...args: any[]) => any>(),
    createMany: jest.fn<(...args: any[]) => any>(),
  },
};

const prisma = {
  userTotpFactor: {
    findUnique: jest.fn<(...args: any[]) => any>(),
  },
  mfaRecoveryCode: {
    count: jest.fn<(...args: any[]) => any>(),
    findMany: jest.fn<(...args: any[]) => any>(),
  },
  $transaction: jest.fn(async (operation: (client: typeof transaction) => Promise<any>) => operation(transaction)),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)),
  () => ({ prisma }),
);

const repository = await import("../../../../src/infra/database/repositories/mfa.repository.js");

describe("MFA repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("writes encrypted factor fields and recovery digests in one transaction", async () => {
    transaction.userTotpFactor.create.mockResolvedValue({ id: "factor-1" });
    await repository.createTotpFactorWithRecoveryCodes({
      userId: "user-1",
      encryptedSecret: { ciphertext: "cipher", iv: "iv", authTag: "tag", keyVersion: 1 },
      initialTimeStep: 123n,
      recoveryCodeDigests: ["digest-1", "digest-2"],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.userTotpFactor.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        secretCiphertext: "cipher",
        secretIv: "iv",
        secretAuthTag: "tag",
        keyVersion: 1,
        lastUsedTimeStep: 123n,
        recoveryCodes: { createMany: { data: [{ digest: "digest-1" }, { digest: "digest-2" }] } },
      }),
      select: { id: true },
    });
  });

  it("atomically advances a TOTP time step and replaces recovery codes", async () => {
    transaction.userTotpFactor.updateMany.mockResolvedValue({ count: 1 });
    transaction.mfaRecoveryCode.deleteMany.mockResolvedValue({ count: 10 });
    transaction.mfaRecoveryCode.createMany.mockResolvedValue({ count: 10 });

    await expect(
      repository.replaceRecoveryCodes({
        factorId: "factor-1",
        assertion: { type: "totp", timeStep: 124n },
        recoveryCodeDigests: ["new-digest"],
      }),
    ).resolves.toBe(true);
    expect(transaction.userTotpFactor.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "factor-1" }),
        data: { lastUsedTimeStep: 124n },
      }),
    );
    expect(transaction.mfaRecoveryCode.deleteMany).toHaveBeenCalledWith({ where: { factorId: "factor-1" } });
    expect(transaction.mfaRecoveryCode.createMany).toHaveBeenCalledWith({
      data: [{ factorId: "factor-1", digest: "new-digest" }],
    });
  });

  it("rejects a concurrently reused TOTP step without replacing codes", async () => {
    transaction.userTotpFactor.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      repository.replaceRecoveryCodes({
        factorId: "factor-1",
        assertion: { type: "totp", timeStep: 124n },
        recoveryCodeDigests: ["new-digest"],
      }),
    ).resolves.toBe(false);
    expect(transaction.mfaRecoveryCode.deleteMany).not.toHaveBeenCalled();
  });

  it("consumes a recovery code only when it is unused", async () => {
    transaction.mfaRecoveryCode.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    transaction.userTotpFactor.delete.mockResolvedValue({ id: "factor-1" });

    const params = {
      factorId: "factor-1",
      assertion: { type: "recovery" as const, recoveryCodeId: "recovery-1" },
    };
    await expect(repository.deleteTotpFactor(params)).resolves.toBe(true);
    await expect(repository.deleteTotpFactor(params)).resolves.toBe(false);
    expect(transaction.mfaRecoveryCode.updateMany).toHaveBeenCalledWith({
      where: { id: "recovery-1", factorId: "factor-1", usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    expect(transaction.userTotpFactor.delete).toHaveBeenCalledTimes(1);
  });
});
