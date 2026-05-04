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

describe("controllers: families (more)", () => {
  beforeEach(() => {
    Object.values(familiesService).forEach((fn: any) => fn.mockReset());
  });

  it("getFamilyByIdController returns family", async () => {
    familiesService.getFamilyByIdService.mockResolvedValue({ id: "f1" });
    const req = mockReq({ params: { id: "f1" } as any });
    const res = mockRes();
    await ctrl.getFamilyByIdController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ success: true, data: { id: "f1" } }));
  });

  it("deleteFamilyController returns message", async () => {
    familiesService.deleteFamilyService.mockResolvedValue({ id: "f1" });
    const req = mockReq({ params: { id: "f1" } as any });
    const res = mockRes();
    await ctrl.deleteFamilyController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ message: "Family deleted" }));
  });
});

