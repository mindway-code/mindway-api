import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const svc = {
  listSocialNetworksService: jest.fn<(...args: any[]) => any>(),
  createSocialNetworkService: jest.fn<(...args: any[]) => any>(),
  updateSocialNetworkService: jest.fn<(...args: any[]) => any>(),
  deleteSocialNetworkService: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule("../../src/api/v1/modules/socialNetworks/socialNetwork.service.js", () => svc);

const ctrl = await import("../../src/api/v1/modules/socialNetworks/socialNetwork.controller.js");

describe("controllers: socialNetworks", () => {
  beforeEach(() => {
    Object.values(svc).forEach((fn: any) => fn.mockReset());
  });

  it("createSocialNetworkController returns message", async () => {
    svc.createSocialNetworkService.mockResolvedValue({ id: "sn1" });
    const req = mockReq({ body: { name: "X" } as any });
    const res = mockRes();
    await ctrl.createSocialNetworkController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ message: "SocialNetwork created" }));
  });
});

