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
  });
});
