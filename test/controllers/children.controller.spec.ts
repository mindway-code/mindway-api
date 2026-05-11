import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const childrenService = {
  createChildService: jest.fn<Promise<any>, [any]>(),
  listChildrenService: jest.fn<Promise<any>, [any]>(),
  listMyChildrenService: jest.fn<Promise<any>, [any]>(),
  getChildByIdService: jest.fn<Promise<any>, [any]>(),
  updateChildService: jest.fn<Promise<any>, [any]>(),
  deleteChildService: jest.fn<Promise<any>, [any]>(),
  getChildByAccessCodeService: jest.fn<Promise<any>, [any]>(),
};

jest.unstable_mockModule("../../src/api/v1/modules/children/children.service.js", () => childrenService);

const { createChildController } = await import("../../src/api/v1/modules/children/children.controller.js");

describe("controllers: children", () => {
  beforeEach(() => {
    childrenService.createChildService.mockReset();
  });

  it("createChildController returns payload", async () => {
    childrenService.createChildService.mockResolvedValue({ id: "c1", accessCode: "ABCDEFGH" });

    const req = mockReq({ user: { id: "u1", role: "common" } as any, body: { name: "Kid", age: 8, birthDate: "2020-01-01" } as any });
    const res = mockRes();

    await createChildController(req, res);

    expect((res as any)._getJSONData()).toEqual(
      expect.objectContaining({
        success: true,
        data: { id: "c1", accessCode: "ABCDEFGH" },
        message: "Child created",
      }),
    );
  });
});
