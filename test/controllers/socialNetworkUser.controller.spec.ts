import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const svc = {
  listSocialNetworkUsersService: jest.fn<(...args: any[]) => any>(),
  createSocialNetworkUserService: jest.fn<(...args: any[]) => any>(),
  getSocialNetworkUserByIdService: jest.fn<(...args: any[]) => any>(),
  updateSocialNetworkUserService: jest.fn<(...args: any[]) => any>(),
  deleteSocialNetworkUserService: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule("../../src/api/v1/modules/socialNetworkUsers/socialNetworkUser.service.js", () => svc);

const ctrl = await import("../../src/api/v1/modules/socialNetworkUsers/socialNetworkUser.controller.js");

describe("controllers: socialNetworkUsers", () => {
  beforeEach(() => {
    Object.values(svc).forEach((fn: any) => fn.mockReset());
  });

  it("getSocialNetworkUserByIdController returns item", async () => {
    svc.getSocialNetworkUserByIdService.mockResolvedValue({ id: "snu1" });
    const req = mockReq({ params: { id: "snu1" } as any });
    const res = mockRes();
    await ctrl.getSocialNetworkUserByIdController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ success: true, data: { id: "snu1" } }));
  });
});

