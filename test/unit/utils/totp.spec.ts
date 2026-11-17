import { describe, expect, it } from "@jest/globals";
import { generateSync } from "otplib";
import {
  buildTotpUri,
  generateTotpSecret,
  verifyTotpCode,
} from "../../../src/utils/crypto/totp.js";

const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const now = new Date("2026-01-01T00:00:30.000Z");

function codeAt(date: Date): string {
  return generateSync({
    strategy: "totp",
    secret,
    algorithm: "sha1",
    digits: 6,
    period: 30,
    epoch: Math.floor(date.getTime() / 1000),
  });
}

describe("TOTP wrapper", () => {
  it("generates a 20-byte Base32 secret and compatible URI", () => {
    const generated = generateTotpSecret();
    expect(generated).toMatch(/^[A-Z2-7]+$/);
    expect(generated).not.toContain("=");
    const uri = buildTotpUri({ issuer: "MINDWAY", accountName: "alice@example.com", secret: generated });
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain(`secret=${generated}`);
    expect(uri).toContain("issuer=MINDWAY");
  });

  it("verifies current and adjacent steps at a fixed time", () => {
    const current = verifyTotpCode({ secret, code: codeAt(now), now });
    const previous = verifyTotpCode({ secret, code: codeAt(new Date(now.getTime() - 30_000)), now });
    const next = verifyTotpCode({ secret, code: codeAt(new Date(now.getTime() + 30_000)), now });
    expect(current).toEqual({ valid: true, matchedTimeStep: Math.floor(now.getTime() / 30_000) });
    expect(previous.valid).toBe(true);
    expect(next.valid).toBe(true);
  });

  it("rejects codes outside the adjacent-step window", () => {
    expect(
      verifyTotpCode({ secret, code: codeAt(new Date(now.getTime() - 60_000)), now }),
    ).toEqual({ valid: false });
  });
});
