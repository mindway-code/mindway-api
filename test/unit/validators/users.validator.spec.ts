import { describe, expect, it } from "@jest/globals";
import {
  changeMyPasswordSchema,
  createUserSchema,
  updateMeSchema,
} from "../../../src/api/v1/validators/users.validator.js";

describe("users validators", () => {
  it("accepts all roles on the authenticated administrator creation contract", () => {
    for (const role of ["admin", "common", "enterprise", "professional", "therapist"]) {
      expect(createUserSchema.safeParse({ name: "Admin created", role }).success).toBe(true);
    }
  });

  it("rejects role and password changes on the self-profile contract", () => {
    expect(updateMeSchema.safeParse({ name: "Alice" }).success).toBe(true);
    expect(updateMeSchema.safeParse({ role: "admin" }).success).toBe(false);
    expect(updateMeSchema.safeParse({ password: "secret1" }).success).toBe(false);
  });

  it("requires both current and sufficiently long new passwords", () => {
    expect(
      changeMyPasswordSchema.safeParse({ currentPassword: "old-password", newPassword: "new-password" }).success,
    ).toBe(true);
    expect(changeMyPasswordSchema.safeParse({ currentPassword: "", newPassword: "short" }).success).toBe(false);
  });
});
