import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { makeChildrenServices } from "../../../src/api/v1/modules/children/children.service.js";
import { badRequest, conflict, forbidden, notFound } from "../../../src/core/errors/httpError.js";

const repo = {
  findUserById: jest.fn<Promise<any>, [string]>(),
  createChild: jest.fn<Promise<any>, [any]>(),
  getChildById: jest.fn<Promise<any>, [string, any]>(),
  getChildByAccessCode: jest.fn<Promise<any>, [string]>(),
  getChildIdByAccessCode: jest.fn<Promise<any>, [string]>(),
  listChildren: jest.fn<Promise<any>, [any]>(),
  updateChild: jest.fn<Promise<any>, [string, any]>(),
  deleteChild: jest.fn<Promise<any>, [string]>(),
};

const codes = {
  generateAccessCode: jest.fn<string, [number]>(),
};

const pagination = {
  pagination: jest.fn((pageRaw: unknown, pageSizeRaw: unknown) => {
    const page = Number(pageRaw ?? 1) || 1;
    const pageSize = Number(pageSizeRaw ?? 10) || 10;
    return { page, pageSize, skip: 0, take: pageSize };
  }),
};

const services = makeChildrenServices({
  pagination: pagination.pagination as any,
  badRequest,
  conflict,
  forbidden,
  notFound,
  generateAccessCode: codes.generateAccessCode as any,
  findUserById: repo.findUserById as any,
  createChild: repo.createChild as any,
  getChildById: repo.getChildById as any,
  getChildByAccessCode: repo.getChildByAccessCode as any,
  getChildIdByAccessCode: repo.getChildIdByAccessCode as any,
  listChildren: repo.listChildren as any,
  updateChild: repo.updateChild as any,
  deleteChild: repo.deleteChild as any,
});

describe("children: services", () => {
  beforeEach(() => {
    repo.findUserById.mockReset();
    repo.createChild.mockReset();
    repo.getChildById.mockReset();
    repo.getChildByAccessCode.mockReset();
    repo.getChildIdByAccessCode.mockReset();
    repo.listChildren.mockReset();
    repo.updateChild.mockReset();
    repo.deleteChild.mockReset();
    codes.generateAccessCode.mockReset();
  });

  it("admin can create child for any responsibleId", async () => {
    repo.findUserById.mockResolvedValue({ id: "u2" });
    repo.getChildIdByAccessCode.mockResolvedValue(null);
    codes.generateAccessCode.mockReturnValue("ABCDEFGH");
    repo.createChild.mockResolvedValue({ id: "c1", accessCode: "ABCDEFGH" });

    const created = await services.createChildService({
      requesterId: "admin-1",
      requesterRole: "admin" as any,
      dto: { responsibleId: "u2", name: "Kid", age: 8, birthDate: "2020-01-01" } as any,
    });

    expect(created).toEqual(expect.objectContaining({ id: "c1", accessCode: "ABCDEFGH" }));
    expect(repo.createChild).toHaveBeenCalledWith(expect.objectContaining({ responsibleId: "u2", accessCode: "ABCDEFGH" }));
  });

  it("admin can create child for self when responsibleId is omitted", async () => {
    repo.findUserById.mockResolvedValue({ id: "admin-1" });
    repo.getChildIdByAccessCode.mockResolvedValue(null);
    codes.generateAccessCode.mockReturnValue("ABCDEFGH");
    repo.createChild.mockResolvedValue({ id: "c1", accessCode: "ABCDEFGH", responsibleId: "admin-1" });

    await services.createChildService({
      requesterId: "admin-1",
      requesterRole: "admin" as any,
      dto: { name: "Kid", age: 8, birthDate: "2020-01-01" } as any,
    });

    expect(repo.createChild).toHaveBeenCalledWith(expect.objectContaining({ responsibleId: "admin-1" }));
  });

  it("common user can create child for self (responsibleId forced)", async () => {
    repo.findUserById.mockResolvedValue({ id: "u1" });
    repo.getChildIdByAccessCode.mockResolvedValue(null);
    codes.generateAccessCode.mockReturnValue("ABCDEFGH");
    repo.createChild.mockResolvedValue({ id: "c1", accessCode: "ABCDEFGH", responsibleId: "u1" });

    await services.createChildService({
      requesterId: "u1",
      requesterRole: "common" as any,
      dto: { responsibleId: "u2", name: "Kid", age: 8, birthDate: "2020-01-01" } as any,
    });

    expect(repo.createChild).toHaveBeenCalledWith(expect.objectContaining({ responsibleId: "u1" }));
  });

  it("therapist cannot create child", async () => {
    await expect(
      services.createChildService({
        requesterId: "t1",
        requesterRole: "therapist" as any,
        dto: { name: "Kid", age: 8, birthDate: "2020-01-01" } as any,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });

  it("responsible can update own child", async () => {
    repo.getChildById.mockResolvedValue({
      id: "c1",
      responsibleId: "u1",
      secondaryResponsibleId: null,
      accessCode: "ABCDEFGH",
    });
    repo.updateChild.mockResolvedValue({ id: "c1", name: "Updated" });

    await services.updateChildService({
      requesterId: "u1",
      requesterRole: "common" as any,
      childId: "c1",
      dto: { name: "Updated" } as any,
    });

    expect(repo.updateChild).toHaveBeenCalledWith("c1", expect.objectContaining({ name: "Updated" }));
  });

  it("responsible cannot update another user's child", async () => {
    repo.getChildById.mockResolvedValue({
      id: "c1",
      responsibleId: "u2",
      secondaryResponsibleId: null,
      accessCode: "ABCDEFGH",
    });

    await expect(
      services.updateChildService({
        requesterId: "u1",
        requesterRole: "common" as any,
        childId: "c1",
        dto: { name: "Updated" } as any,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });

  it("admin can delete child", async () => {
    repo.getChildById.mockResolvedValue({
      id: "c1",
      responsibleId: "u2",
      secondaryResponsibleId: null,
      accessCode: "ABCDEFGH",
    });
    repo.deleteChild.mockResolvedValue({ id: "c1" });

    const deleted = await services.deleteChildService({ requesterId: "a1", requesterRole: "admin" as any, childId: "c1" });
    expect(deleted).toEqual({ id: "c1" });
  });

  it("therapist cannot view child without valid code", async () => {
    repo.getChildByAccessCode.mockResolvedValue(null);

    await expect(
      services.getChildByAccessCodeService({ requesterId: "t1", requesterRole: "therapist" as any, accessCode: "ABCDEFGH" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });

  it("therapist can view child with valid code (without accessCode in payload)", async () => {
    repo.getChildByAccessCode.mockResolvedValue({ id: "c1", name: "Kid" });

    const child = await services.getChildByAccessCodeService({
      requesterId: "t1",
      requesterRole: "therapist" as any,
      accessCode: "ABCDEFGH",
    });

    expect(child).toEqual(expect.objectContaining({ id: "c1" }));
    expect((child as any).accessCode).toBeUndefined();
  });

  it("generates a different accessCode when collision exists", async () => {
    repo.findUserById.mockResolvedValue({ id: "u1" });
    codes.generateAccessCode.mockReturnValueOnce("AAAAAAA1").mockReturnValueOnce("BBBBBBB2");
    repo.getChildIdByAccessCode.mockResolvedValueOnce({ id: "c-existing" }).mockResolvedValueOnce(null);
    repo.createChild.mockResolvedValue({ id: "c1", accessCode: "BBBBBBB2" });

    const created = await services.createChildService({
      requesterId: "u1",
      requesterRole: "common" as any,
      dto: { name: "Kid", age: 8, birthDate: "2020-01-01" } as any,
    });

    expect(created).toEqual(expect.objectContaining({ accessCode: "BBBBBBB2" }));
    expect(repo.getChildIdByAccessCode).toHaveBeenCalledTimes(2);
  });
});
