import { describe, expect, it, jest } from "@jest/globals";
import { makeAssociationChildrenServices } from "../../../src/api/v1/modules/associationChildren/associationChildren.service.js";
import { badRequest, notFound } from "../../../src/core/errors/httpError.js";

function makeDeps() {
  return {
    badRequest,
    notFound,
    getChildByAccessCodeWithAccessCode: jest.fn<(...args: any[]) => any>(),
    findAssociationByUserAndChild: jest.fn<(...args: any[]) => any>(),
    createAssociationChild: jest.fn<(...args: any[]) => any>(),
  };
}

describe("association children: access-code rules", () => {
  it("rejects an unknown access code without creating an association", async () => {
    const deps = makeDeps();
    deps.getChildByAccessCodeWithAccessCode.mockResolvedValue(null);
    const service = makeAssociationChildrenServices(deps as any);

    await expect(
      service.associateByAccessCodeService({ requesterId: "u1", dto: { accessCode: "UNKNOWN" } }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(deps.createAssociationChild).not.toHaveBeenCalled();
  });

  it("is idempotent when the requester is already responsible", async () => {
    const deps = makeDeps();
    deps.getChildByAccessCodeWithAccessCode.mockResolvedValue({
      id: "c1",
      responsibleId: "u1",
      secondaryResponsibleId: null,
      accessCode: "ABCDEFGH",
    });
    const service = makeAssociationChildrenServices(deps as any);

    await expect(
      service.associateByAccessCodeService({ requesterId: "u1", dto: { accessCode: "ABCDEFGH" } }),
    ).resolves.toEqual(expect.objectContaining({ association: null, alreadyHadAccess: true }));
    expect(deps.findAssociationByUserAndChild).not.toHaveBeenCalled();
    expect(deps.createAssociationChild).not.toHaveBeenCalled();
  });
});
