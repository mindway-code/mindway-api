import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { makeUsersServices } from "../../../src/api/v1/modules/users/users.service.js";
import { badRequest } from "../../../src/core/errors/httpError.js";

const deps = {
  pagination: jest.fn(() => ({ page: 1, pageSize: 10, skip: 0, take: 10 })),
  badRequest,
  hashPassword: jest.fn(async (v: string) => `hash(${v})`),
  listUsers: jest.fn<(...args: any[]) => any>(),
  getMe: jest.fn<(...args: any[]) => any>(),
  createUser: jest.fn<(...args: any[]) => any>(),
  updateUser: jest.fn<(...args: any[]) => any>(),
  deleteUser: jest.fn<(...args: any[]) => any>(),
};

const svc = makeUsersServices(deps as any);

describe("users: more service coverage", () => {
  beforeEach(() => {
    deps.getMe.mockReset();
    deps.createUser.mockReset();
    deps.updateUser.mockReset();
    deps.hashPassword.mockClear();
  });

  it("createUser defaults role/provider and hashes password", async () => {
    deps.createUser.mockResolvedValue({ id: "u1" });
    await svc.createUserService({ name: " Alice ", email: null, password: "x" } as any);
    expect(deps.hashPassword).toHaveBeenCalledWith("x");
    expect(deps.createUser).toHaveBeenCalledWith(expect.objectContaining({ role: "common", provider: "local" }));
  });

  it("updateUser hashes password when provided", async () => {
    deps.getMe.mockResolvedValue({ id: "u1" });
    deps.updateUser.mockResolvedValue({ id: "u1" });
    await svc.updateUserService("u1", { password: "x" } as any);
    expect(deps.updateUser).toHaveBeenCalledWith("u1", expect.objectContaining({ passwordHash: "hash(x)" }));
  });
});

