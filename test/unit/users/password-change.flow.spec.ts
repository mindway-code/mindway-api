import { describe, expect, it, jest } from "@jest/globals";
import { makeUsersServices } from "../../../src/api/v1/modules/users/users.service.js";
import {
  badRequest,
  passwordReauthenticationUnsupported,
  unauthorized,
} from "../../../src/core/errors/httpError.js";
import { hashPassword, verifyPassword } from "../../../src/utils/crypto/hash.js";

describe("users: password change flow", () => {
  it("invalidates the old password, accepts the new password, and revokes sessions", async () => {
    let storedHash = await hashPassword("current-password");
    let sessionsRevoked = false;

    const services = makeUsersServices({
      pagination: jest.fn() as any,
      badRequest,
      unauthorized,
      passwordReauthenticationUnsupported,
      hashPassword,
      verifyPassword,
      listUsers: jest.fn() as any,
      getMe: jest.fn() as any,
      createUser: jest.fn() as any,
      updateUser: jest.fn() as any,
      deleteUser: jest.fn() as any,
      findAuthUserByIdForPassword: jest.fn(async () => ({
        id: "u1",
        name: "Alice",
        email: "alice@example.com",
        role: "common" as const,
        provider: "local" as const,
        googleId: null,
        passwordHash: storedHash,
      })),
      changePasswordAndRevokeRefreshTokens: jest.fn(async (_userId: string, passwordHash: string) => {
        storedHash = passwordHash;
        sessionsRevoked = true;
      }),
    });

    await services.changeMyPasswordService("u1", {
      currentPassword: "current-password",
      newPassword: "new-password",
    });

    await expect(verifyPassword("current-password", storedHash)).resolves.toBe(false);
    await expect(verifyPassword("new-password", storedHash)).resolves.toBe(true);
    expect(sessionsRevoked).toBe(true);
  });
});
