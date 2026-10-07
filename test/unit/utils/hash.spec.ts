import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const bcrypt = {
  hash: jest.fn<(...args: any[]) => any>(),
  compare: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule("bcrypt", () => ({ default: bcrypt }));

const { hashPassword, verifyPassword } = await import("../../../src/utils/crypto/hash.js");

describe("utils: crypto/hash", () => {
  beforeEach(() => {
    bcrypt.hash.mockReset();
    bcrypt.compare.mockReset();
  });

  it("hashPassword delegates to bcrypt.hash", async () => {
    bcrypt.hash.mockResolvedValue("h");
    await expect(hashPassword("p")).resolves.toBe("h");
    expect(bcrypt.hash).toHaveBeenCalledWith("p", expect.any(Number));
  });

  it("verifyPassword delegates to bcrypt.compare", async () => {
    bcrypt.compare.mockResolvedValue(true);
    await expect(verifyPassword("p", "h")).resolves.toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith("p", "h");
  });
});

