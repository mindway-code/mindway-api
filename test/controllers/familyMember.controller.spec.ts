import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const svc = {
  listFamilyMembersService: jest.fn(),
  createFamilyMemberService: jest.fn(),
  getFamilyMemberByIdService: jest.fn(),
  updateFamilyMemberService: jest.fn(),
  deleteFamilyMemberService: jest.fn(),
};

jest.unstable_mockModule("../../src/api/v1/modules/familyMembers/familyMember.service.js", () => svc);

const ctrl = await import("../../src/api/v1/modules/familyMembers/familyMember.controller.js");

describe("controllers: familyMembers", () => {
  beforeEach(() => {
    Object.values(svc).forEach((fn: any) => fn.mockReset());
  });

  it("createFamilyMemberController returns message", async () => {
    svc.createFamilyMemberService.mockResolvedValue({ id: "fm1" });
    const req = mockReq({ body: { userId: "u1", familyId: "f1", role: "child" } as any });
    const res = mockRes();
    await ctrl.createFamilyMemberController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ message: "FamilyMember created" }));
  });
});

