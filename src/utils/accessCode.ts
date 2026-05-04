import { randomBytes } from "node:crypto";

const DEFAULT_LENGTH = 8;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAccessCode(length: number = DEFAULT_LENGTH): string {
  const target = Math.max(6, Math.min(10, Math.floor(Number(length) || DEFAULT_LENGTH)));
  const bytes = randomBytes(target);

  let out = "";
  for (let i = 0; i < target; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export default { generateAccessCode };
