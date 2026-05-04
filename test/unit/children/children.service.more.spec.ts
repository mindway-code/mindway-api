import { describe, it, expect, jest } from "@jest/globals";
import { makeChildrenServices } from "../../../src/api/v1/modules/children/children.service.js";
import { badRequest, conflict, forbidden, notFound } from "../../../src/core/errors/httpError.js";

const deps = {
  pagination: jest.fn(() => ({ page: 1, pageSize: 10, skip: 0, take: 10 })),
  badRequest,
  conflict,
  forbidden,
  notFound,
  generateAccessCode: jest.fn(() => "ABCDEFGH"),
  findUserById: jest.fn(async () => ({ id: "u1" })),
  createChild: jest.fn(async () => ({ id: "c1", accessCode: "ABCDEFGH" })),
  getChildById: jest.fn(async () => ({ id: "c1", responsibleId: "u1", secondaryResponsibleId: null, accessCode: "ABCDEFGH" })),
  getChildByAccessCode: jest.fn(async () => ({ id: "c1" })),
  getChildIdByAccessCode: jest.fn(async () => null),
  listChildren: jest.fn(async () => ({ items: [], total: 0 })),
  updateChild: jest.fn(async () => ({ id: "c1" })),
  deleteChild: jest.fn(async () => ({ id: "c1" })),
};

const svc = makeChildrenServices(deps as any);

describe("children: more service coverage", () => {
  it("enterprise can read by accessCode", async () => {
    await expect(svc.getChildByAccessCodeService({ requesterId: "e1", requesterRole: "enterprise" as any, accessCode: "ABCDEFGH" })).resolves.toEqual(expect.objectContaining({ id: "c1" }));
  });

  it("professional cannot manage child (non-common)", async () => {
    await expect(svc.getChildByIdService({ requesterId: "p1", requesterRole: "professional" as any, childId: "c1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

