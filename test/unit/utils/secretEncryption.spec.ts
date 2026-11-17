import { describe, expect, it } from "@jest/globals";
import { decryptSecret, encryptSecret } from "../../../src/utils/crypto/secretEncryption.js";

const key = Buffer.alloc(32, 1);

function changeBase64(value: string): string {
  const bytes = Buffer.from(value, "base64");
  bytes[0] = (bytes[0] ?? 0) ^ 1;
  return bytes.toString("base64");
}

describe("secret encryption", () => {
  it("round-trips with a fresh IV", () => {
    const first = encryptSecret({ secret: "BASE32SECRET", key, keyVersion: 1 });
    const second = encryptSecret({ secret: "BASE32SECRET", key, keyVersion: 1 });
    expect(first.iv).not.toBe(second.iv);
    expect(decryptSecret({ encrypted: first, key })).toBe("BASE32SECRET");
  });

  it("rejects the wrong key", () => {
    const encrypted = encryptSecret({ secret: "BASE32SECRET", key, keyVersion: 1 });
    expect(() => decryptSecret({ encrypted, key: Buffer.alloc(32, 2) })).toThrow("Unable to decrypt");
  });

  it.each(["ciphertext", "iv", "authTag"] as const)("rejects modified %s", (field) => {
    const encrypted = encryptSecret({ secret: "BASE32SECRET", key, keyVersion: 1 });
    const modified = { ...encrypted, [field]: changeBase64(encrypted[field]) };
    expect(() => decryptSecret({ encrypted: modified, key })).toThrow("Unable to decrypt");
  });
});
