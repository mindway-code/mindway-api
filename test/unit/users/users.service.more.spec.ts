import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { makeUsersServices } from "../../../src/api/v1/modules/users/users.service.js";
import { badRequest, passwordReauthenticationUnsupported, unauthorized } from "../../../src/core/errors/httpError.js";

const deps = {
  pagination: jest.fn(() => ({ page: 1, pageSize: 10, skip: 0, take: 10 })),
  badRequest,
  unauthorized,
  passwordReauthenticationUnsupported,
  hashPassword: jest.fn(async (v: string) => `hash(${v})`),
  verifyPassword: jest.fn(async () => false),
  listUsers: jest.fn<(...args: any[]) => any>(),
  getMe: jest.fn<(...args: any[]) => any>(),
  createUser: jest.fn<(...args: any[]) => any>(),
  updateUser: jest.fn<(...args: any[]) => any>(),
  deleteUser: jest.fn<(...args: any[]) => any>(),
  findAuthUserByIdForPassword: jest.fn<(...args: any[]) => any>(),
  changePasswordAndRevokeRefreshTokens: jest.fn<(...args: any[]) => any>(),
};

const svc = makeUsersServices(deps as any);

describe("users: more service coverage", () => {
  beforeEach(() => {
    deps.getMe.mockReset();
    deps.createUser.mockReset();
    deps.updateUser.mockReset();
    deps.hashPassword.mockClear();
    deps.verifyPassword.mockReset();
    deps.findAuthUserByIdForPassword.mockReset();
    deps.changePasswordAndRevokeRefreshTokens.mockReset();
  });

  it("createUser defaults role/provider and hashes password", async () => {
    deps.createUser.mockResolvedValue({ id: "u1" });
    await svc.createUserService({ name: " Alice ", email: null, password: "x" } as any);
    expect(deps.hashPassword).toHaveBeenCalledWith("x");
    expect(deps.createUser).toHaveBeenCalledWith(expect.objectContaining({ role: "common", provider: "local" }));
  });

  it("self-profile updates cannot mutate role or password", async () => {
    deps.getMe.mockResolvedValue({ id: "u1" });
    deps.updateUser.mockResolvedValue({ id: "u1" });
    await svc.updateUserService("u1", { name: " Alice ", role: "admin", password: "x" } as any);
    expect(deps.updateUser).toHaveBeenCalledWith("u1", { name: "Alice" });
  });

  it("changes a local password and revokes refresh tokens", async () => {
    deps.findAuthUserByIdForPassword.mockResolvedValue({
      id: "u1",
      provider: "local",
      passwordHash: "old-hash",
    });
    deps.verifyPassword.mockResolvedValue(true);

    await svc.changeMyPasswordService("u1", {
      currentPassword: "current-password",
      newPassword: "new-password",
    });

    expect(deps.verifyPassword).toHaveBeenCalledWith("current-password", "old-hash");
    expect(deps.changePasswordAndRevokeRefreshTokens).toHaveBeenCalledWith("u1", "hash(new-password)");
  });

  it("changes nothing when the current password is wrong", async () => {
    deps.findAuthUserByIdForPassword.mockResolvedValue({
      id: "u1",
      provider: "local",
      passwordHash: "old-hash",
    });
    deps.verifyPassword.mockResolvedValue(false);

    await expect(
      svc.changeMyPasswordService("u1", { currentPassword: "wrong", newPassword: "new-password" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(deps.changePasswordAndRevokeRefreshTokens).not.toHaveBeenCalled();
  });

  it("returns an unsupported reauthentication error for Google-only accounts", async () => {
    deps.findAuthUserByIdForPassword.mockResolvedValue({ id: "u1", provider: "google", passwordHash: null });

    await expect(
      svc.changeMyPasswordService("u1", { currentPassword: "unused", newPassword: "new-password" }),
    ).rejects.toMatchObject({ code: "PASSWORD_REAUTHENTICATION_UNSUPPORTED", statusCode: 409 });
  });
});

