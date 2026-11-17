import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BYTES = 10;

export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  if (!Number.isInteger(count) || count <= 0) throw new Error("Recovery code count must be positive");

  return Array.from({ length: count }, () => {
    const raw = randomBytes(RECOVERY_CODE_BYTES).toString("hex").toUpperCase();
    return raw.match(/.{1,5}/g)!.join("-");
  });
}

export function digestRecoveryCode(code: string, pepper: string): string {
  const normalized = normalizeRecoveryCode(code);
  return createHmac("sha256", pepper).update(normalized, "utf8").digest("hex");
}

export function findMatchingRecoveryCodeId(params: {
  code: string;
  pepper: string;
  candidates: ReadonlyArray<{ id: string; digest: string }>;
}): string | null {
  const expected = Buffer.from(digestRecoveryCode(params.code, params.pepper), "hex");
  let matchedId: string | null = null;

  for (const candidate of params.candidates) {
    const actual = Buffer.from(candidate.digest, "hex");
    const matches = actual.length === expected.length && timingSafeEqual(actual, expected);
    if (matches) matchedId = candidate.id;
  }

  return matchedId;
}
