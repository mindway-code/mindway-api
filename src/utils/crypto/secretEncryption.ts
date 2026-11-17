import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
};

function assertKey(key: Buffer): void {
  if (key.length !== 32) throw new Error("Secret encryption key must be 32 bytes");
}

export function encryptSecret(params: {
  secret: string;
  key: Buffer;
  keyVersion: number;
}): EncryptedSecret {
  assertKey(params.key);
  if (!Number.isInteger(params.keyVersion) || params.keyVersion <= 0) {
    throw new Error("Secret encryption key version must be positive");
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, params.key, iv);
  const ciphertext = Buffer.concat([cipher.update(params.secret, "utf8"), cipher.final()]);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion: params.keyVersion,
  };
}

export function decryptSecret(params: {
  encrypted: EncryptedSecret;
  key: Buffer;
}): string {
  assertKey(params.key);

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      params.key,
      Buffer.from(params.encrypted.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(params.encrypted.authTag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(params.encrypted.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Unable to decrypt protected secret");
  }
}
