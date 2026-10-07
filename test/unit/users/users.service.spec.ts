import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { makeUsersServices } from "../../../src/api/v1/modules/users/users.service.js";
import { pagination } from "../../../src/utils/pagination.js";
import { badRequest } from "../../../src/core/errors/httpError.js";

const usersRepo = {
  listUsers: jest.fn<(input: any) => Promise<any>>(),
  getMe: jest.fn<(id: string) => Promise<any>>(),
  createUser: jest.fn<(input: any) => Promise<any>>(),
  updateUser: jest.fn<(id: string, input: any) => Promise<any>>(),
  deleteUser: jest.fn<(id: string) => Promise<any>>(),
};

const cryptoHash = {
  hashPassword: jest.fn(async (value: string) => `hash(${value})`),
};

const { listUsersService, createUserService } = makeUsersServices({
  pagination,
  badRequest,
  hashPassword: cryptoHash.hashPassword as any,
  listUsers: usersRepo.listUsers as any,
  getMe: usersRepo.getMe as any,
  createUser: usersRepo.createUser as any,
  updateUser: usersRepo.updateUser as any,
  deleteUser: usersRepo.deleteUser as any,
});

describe("users: services", () => {
  beforeEach(() => {
    usersRepo.listUsers.mockReset();
    usersRepo.createUser.mockReset();
    cryptoHash.hashPassword.mockClear();
  });

  it("listUsersService returns pagination meta", async () => {
    usersRepo.listUsers.mockResolvedValue({ items: [{ id: "u1" }], total: 1 });

    const result = await listUsersService("1", "10");

    expect(result.items).toHaveLength(1);
    expect(result.meta.pagination).toEqual({ page: 1, pageSize: 10, total: 1, totalPages: 1 });
    expect(usersRepo.listUsers).toHaveBeenCalledWith({ skip: 0, take: 10 });
  });

  it("createUserService trims name and hashes password", async () => {
    usersRepo.createUser.mockResolvedValue({ id: "u1" });

    await createUserService({ name: "  Bob  ", password: "pass" } as any);

    expect(cryptoHash.hashPassword).toHaveBeenCalledWith("pass");
    expect(usersRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Bob",
        passwordHash: "hash(pass)",
        role: "common",
        provider: "local",
      }),
    );
  });
});
