import { describe, it, expect } from "@jest/globals";
import { generateAccessCode } from "../../../src/utils/accessCode.js";

describe("utils: accessCode", () => {
  it("generates uppercase alphanumeric code (default length)", () => {
    const code = generateAccessCode();
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it("clamps length to [6, 10]", () => {
    expect(generateAccessCode(2)).toHaveLength(6);
    expect(generateAccessCode(999)).toHaveLength(10);
  });
});

