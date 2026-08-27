import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const familiesService = {
  listFamiliesService: jest.fn(),
  listMyFamiliesService: jest.fn(),
  createFamilyService: jest.fn(),
  getFamilyByIdService: jest.fn(),
  updateFamilyService: jest.fn(),
  deleteFamilyService: jest.fn(),
};

jest.unstable_mockModule("../../src/api/v1/modules/families/families.service.js", () => familiesService);

const ctrl = await import("../../src/api/v1/modules/families/families.controller.js");

describe("controllers: families", () => {
  beforeEach(() => {
    Object.values(familiesService).forEach((fn: any) => fn.mockReset());
  });

  it("createFamilyController returns created family", async () => {
    familiesService.createFamilyService.mockResolvedValue({ id: "f1", name: "X" });
    const req = mockReq({ body: { name: "X" } as any });
    const res = mockRes();

    await ctrl.createFamilyController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ success: true, message: "Family created" }));
  });

  it("listMyFamiliesController uses req.user.id", async () => {
    familiesService.listMyFamiliesService.mockResolvedValue({ items: [], meta: { pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } } });
    const req = mockReq({ user: { id: "u1", role: "common" } as any, query: {} as any });
    const res = mockRes();
    await ctrl.listMyFamiliesController(req, res);
    expect(familiesService.listMyFamiliesService).toHaveBeenCalledWith("u1", undefined, undefined);
  });
});
