import { describe, expect, it, jest } from "@jest/globals";
import {
  makeSecurityStore,
  SecurityStoreUnavailableError,
} from "../../../src/infra/redis/securityStore.js";

function makeClient() {
  return {
    set: jest.fn<(...args: any[]) => any>(),
    get: jest.fn<(...args: any[]) => any>(),
    del: jest.fn<(...args: any[]) => any>(),
    eval: jest.fn<(...args: any[]) => any>(),
  };
}

describe("MFA security store", () => {
  it("stores pending enrollment with a TTL and loads it", async () => {
    const client = makeClient();
    const enrollment = {
      userId: "user-1",
      encryptedSecret: { ciphertext: "cipher", iv: "iv", authTag: "tag", keyVersion: 1 },
    };
    client.get.mockResolvedValue(JSON.stringify(enrollment));
    const store = makeSecurityStore({ getClient: async () => client as any });

    await store.storePendingEnrollment("enrollment-1", enrollment, 600);
    await expect(store.loadPendingEnrollment("enrollment-1")).resolves.toEqual(enrollment);
    expect(client.set).toHaveBeenCalledWith(
      "mfa:enrollment:enrollment-1",
      JSON.stringify(enrollment),
      { EX: 600 },
    );
  });

  it("increments attempts atomically and sets expiry in the Lua script", async () => {
    const client = makeClient();
    client.eval.mockResolvedValue(1);
    const store = makeSecurityStore({ getClient: async () => client as any });

    await expect(store.incrementFailedAttempt("user-1", "127.0.0.1", 300)).resolves.toBe(1);
    expect(client.eval).toHaveBeenCalledWith(
      expect.stringContaining("EXPIRE"),
      expect.objectContaining({ arguments: ["300"] }),
    );
    const keys = client.eval.mock.calls[0]![1].keys as string[];
    expect(keys[0]).toMatch(/^mfa:attempt:user-1:[a-f0-9]{64}$/);
    expect(keys[0]).not.toContain("127.0.0.1");
  });

  it("fails closed when Redis is unavailable", async () => {
    const store = makeSecurityStore({
      getClient: async () => {
        throw new Error("connection refused");
      },
    });

    await expect(store.loadPendingEnrollment("enrollment-1")).rejects.toBeInstanceOf(
      SecurityStoreUnavailableError,
    );
    await expect(store.getFailedAttemptCount("user-1", "127.0.0.1")).rejects.toBeInstanceOf(
      SecurityStoreUnavailableError,
    );
    await expect(store.consumeStepUpGrant({
      token: "proof",
      userId: "user-1",
      action: "report.validate",
      resourceType: "reportRevision",
      resourceId: "revision-1",
    })).rejects.toBeInstanceOf(SecurityStoreUnavailableError);
  });

  it("issues at least 256 bits of opaque material and stores only its digest", async () => {
    const client = makeClient();
    const store = makeSecurityStore({ getClient: async () => client as any });
    const grant = {
      userId: "user-1",
      action: "report.validate" as const,
      resourceType: "reportRevision" as const,
      resourceId: "revision-1",
      method: "TOTP" as const,
      factorId: "factor-1",
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    };

    const proof = await store.issueStepUpGrant(grant, 300);

    expect(Buffer.from(proof, "base64url")).toHaveLength(32);
    expect(client.set).toHaveBeenCalledTimes(2);
    const storedKey = client.set.mock.calls[0]![0] as string;
    expect(storedKey).toMatch(/^mfa:step-up:[a-f0-9]{64}$/);
    expect(storedKey).not.toContain(proof);
    expect(client.set).toHaveBeenCalledWith(storedKey, JSON.stringify(grant), { EX: 300 });
  });

  it.each(["CONSUMED", "IDEMPOTENT_REPLAY"] as const)("atomically returns a sanitized %s grant", async (status) => {
    const client = makeClient();
    const grant = {
      userId: "user-1",
      action: "report.validate",
      resourceType: "reportRevision",
      resourceId: "revision-1",
      method: "TOTP",
      factorId: "factor-1",
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      consumedAt: new Date().toISOString(),
      consumedIdempotencyKey: "idem-1",
    };
    client.eval.mockResolvedValue(JSON.stringify({ status, grant }));
    const store = makeSecurityStore({ getClient: async () => client as any });

    await expect(store.consumeStepUpGrant({
      token: "secret-proof",
      userId: "user-1",
      action: "report.validate",
      resourceType: "reportRevision",
      resourceId: "revision-1",
      idempotencyKey: "idem-1",
    })).resolves.toEqual({
      status,
      grant: expect.not.objectContaining({ consumedAt: expect.anything(), consumedIdempotencyKey: expect.anything() }),
    });
    const keys = client.eval.mock.calls[0]![1].keys as string[];
    expect(keys.join(":" )).not.toContain("secret-proof");
  });

  it.each(["INVALID", "EXPIRED", "ALREADY_USED", "SCOPE_MISMATCH"] as const)(
    "distinguishes a %s proof without returning metadata",
    async (status) => {
      const client = makeClient();
      client.eval.mockResolvedValue(JSON.stringify({ status }));
      const store = makeSecurityStore({ getClient: async () => client as any });
      await expect(store.consumeStepUpGrant({
        token: "proof",
        userId: "user-1",
        action: "report.validate",
        resourceType: "reportRevision",
        resourceId: "revision-1",
      })).resolves.toEqual({ status });
    },
  );
});
