import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const childrenService = {
  createChildService: jest.fn<(input: any) => Promise<any>>(),
  listChildrenService: jest.fn<(input: any) => Promise<any>>(),
  listMyChildrenService: jest.fn<(input: any) => Promise<any>>(),
  getChildByIdService: jest.fn<(input: any) => Promise<any>>(),
  updateChildService: jest.fn<(input: any) => Promise<any>>(),
  deleteChildService: jest.fn<(input: any) => Promise<any>>(),
  getChildByAccessCodeService: jest.fn<(input: any) => Promise<any>>(),
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
