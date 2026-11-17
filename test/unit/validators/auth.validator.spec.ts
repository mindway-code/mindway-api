import { describe, expect, it } from "@jest/globals";
import { loginSchema, registerSchema } from "../../../src/api/v1/validators/auth.validator.js";

const validRegister = {
  name: "Alice",
  email: "alice@example.com",
  password: "secret1",
  confirmPassword: "secret1",
  role: "common",
};

describe("auth validators", () => {
  it.each(["common", "enterprise", "professional", "therapist"])("accepts public role %s", (role) => {
    expect(registerSchema.safeParse({ ...validRegister, role }).success).toBe(true);
  });

  it.each([undefined, "admin", "ADMIN", "unknown"])("rejects role %s", (role) => {
    expect(registerSchema.safeParse({ ...validRegister, role }).success).toBe(false);
  });

  it.each([
    { email: "invalid" },
    { password: undefined },
    { confirmPassword: "different" },
    { provider: "google" },
    { googleId: "external-id" },
    { cnpj: "00.000.000/0000-00" },
  ])("rejects malformed or server-controlled registration data: %o", (override) => {
    expect(registerSchema.safeParse({ ...validRegister, ...override }).success).toBe(false);
  });

  it("strictly validates login payloads", () => {
    expect(loginSchema.safeParse({ email: "alice@example.com", password: "secret1" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "invalid", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "alice@example.com", password: "secret1", role: "admin" }).success).toBe(false);
  });
});
