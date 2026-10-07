import { describe, expect, it, jest } from "@jest/globals";
import { makeReportsChildrenServices } from "../../../src/api/v1/modules/reportsChildren/reportsChildren.service.js";
import { badRequest, forbidden, notFound } from "../../../src/core/errors/httpError.js";

function makeDeps() {
  return {
    pagination: jest.fn(() => ({ page: 1, pageSize: 10, skip: 0, take: 10 })),
    badRequest,
    forbidden,
    notFound,
    getChildById: jest.fn<(...args: any[]) => any>(),
    findAssociationByUserAndChild: jest.fn<(...args: any[]) => any>(),
    createAssociationChild: jest.fn<(...args: any[]) => any>(),
    listReportsChildrenByChild: jest.fn<(...args: any[]) => any>(),
    getReportsChildById: jest.fn<(...args: any[]) => any>(),
    createReportsChild: jest.fn<(...args: any[]) => any>(),
    updateReportsChild: jest.fn<(...args: any[]) => any>(),
    deleteReportsChild: jest.fn<(...args: any[]) => any>(),
  };
}

describe("reports children: authorization rules", () => {
  it("rejects listing reports for an unrelated user", async () => {
    const deps = makeDeps();
    deps.getChildById.mockResolvedValue({ id: "c1", responsibleId: "owner", secondaryResponsibleId: null });
    deps.findAssociationByUserAndChild.mockResolvedValue(null);
    const service = makeReportsChildrenServices(deps as any);

    await expect(
      service.listReportsByChildService({
        requesterId: "unrelated",
        requesterRole: "common",
        childId: "c1",
        pageRaw: 1,
        pageSizeRaw: 10,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(deps.listReportsChildrenByChild).not.toHaveBeenCalled();
  });

  it("allows an associated report author to update their report", async () => {
    const deps = makeDeps();
    deps.getReportsChildById.mockResolvedValue({ id: "r1", childId: "c1", userId: "author" });
    deps.getChildById.mockResolvedValue({ id: "c1", responsibleId: "owner", secondaryResponsibleId: null });
    deps.findAssociationByUserAndChild.mockResolvedValue({ id: "association-1" });
    deps.updateReportsChild.mockResolvedValue({ id: "r1", childId: "c1", userId: "author", title: "Updated" });
    const service = makeReportsChildrenServices(deps as any);

    await expect(
      service.updateReportService({
        requesterId: "author",
        requesterRole: "professional",
        reportId: "r1",
        dto: { title: " Updated " },
      }),
    ).resolves.toEqual(expect.objectContaining({ id: "r1", title: "Updated" }));
    expect(deps.updateReportsChild).toHaveBeenCalledWith("r1", { title: "Updated" });
  });
});
