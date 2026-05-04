import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const usersService = {
  listUsersService: jest.fn<Promise<any>, [any, any]>(),
  getMeService: jest.fn<Promise<any>, [any]>(),
  createUserService: jest.fn<Promise<any>, [any]>(),
  updateUserService: jest.fn<Promise<any>, [any, any]>(),
  deleteUserService: jest.fn<Promise<any>, [any]>(),
};

jest.unstable_mockModule("../../src/api/v1/modules/users/users.service.js", () => usersService);

const ctrl = await import("../../src/api/v1/modules/users/users.controller.js");

describe("controllers: users", () => {
  beforeEach(() => {
    usersService.listUsersService.mockReset();
    usersService.getMeService.mockReset();
    usersService.createUserService.mockReset();
    usersService.updateUserService.mockReset();
    usersService.deleteUserService.mockReset();
  });

  it("listUsersController returns paginated items", async () => {
    usersService.listUsersService.mockResolvedValue({ items: [{ id: "u1" }], meta: { pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 } } });
    const req = mockReq({ query: { page: "1", pageSize: "10" } as any });
    const res = mockRes();

    await ctrl.listUsersController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ success: true, data: [{ id: "u1" }], meta: expect.any(Object) }));
  });

  it("getMeController uses req.user.id", async () => {
    usersService.getMeService.mockResolvedValue({ id: "u1" });
    const req = mockReq({ user: { id: "u1", role: "common" } as any });
    const res = mockRes();

    await ctrl.getMeController(req, res);
    expect(usersService.getMeService).toHaveBeenCalledWith("u1");
  });

  it("createUserController returns message", async () => {
    usersService.createUserService.mockResolvedValue({ id: "u1" });
    const req = mockReq({ body: { name: "A" } as any });
    const res = mockRes();

    await ctrl.createUserController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ message: "User created" }));
  });
});

