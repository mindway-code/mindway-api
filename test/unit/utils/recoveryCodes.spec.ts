import { describe, expect, it } from "@jest/globals";
import {
  digestRecoveryCode,
  findMatchingRecoveryCodeId,
  generateRecoveryCodes,
  normalizeRecoveryCode,
} from "../../../src/utils/crypto/recoveryCodes.js";

describe("recovery codes", () => {
  it("generates ten unique, formatted, high-entropy codes", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    expect(codes.every((code) => /^[A-F0-9]{5}(?:-[A-F0-9]{5}){3}$/.test(code))).toBe(true);
  });

  it("normalizes formatting before keyed digest verification", () => {
    const pepper = "pepper-that-is-long-and-independent";
    const code = "ABCDE-12345-FEDCB-98765";
    const digest = digestRecoveryCode(code, pepper);
    expect(normalizeRecoveryCode("abcde 12345-fedcb 98765")).toBe("ABCDE12345FEDCB98765");
    expect(
      findMatchingRecoveryCodeId({
        code: "abcde 12345 fedcb 98765",
        pepper,
        candidates: [{ id: "recovery-1", digest }],
      }),
    ).toBe("recovery-1");
  });
});
