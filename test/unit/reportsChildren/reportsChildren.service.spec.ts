import { describe, expect, it, jest } from "@jest/globals";
import { makeReportsChildrenServices } from "../../../src/api/v1/modules/reportsChildren/reportsChildren.service.js";
import { badRequest, forbidden, notFound, reportError } from "../../../src/core/errors/httpError.js";

const draft = {
  id: "revision-1",
  reportId: "report-1",
  revisionNumber: 1,
  createdById: "author",
  status: "DRAFT",
  title: "Draft",
  behavior: null,
  difficulty: null,
  recommendation: null,
  contentHash: "hash",
  submittedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
} as const;

function aggregate(overrides: Record<string, unknown> = {}) {
  return {
    id: "report-1",
    childId: "child-1",
    userId: "author",
    userRole: "professional",
    currentRevisionNumber: 1,
    publishedRevisionNumber: null,
    archivedAt: null,
    archivedById: null,
    user: { id: "author", name: "Author", email: "author@example.com" },
    revisions: [{ ...draft }],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeDeps() {
  return {
    pagination: jest.fn(() => ({ page: 1, pageSize: 10, skip: 0, take: 10 })),
    badRequest,
    forbidden,
    notFound,
    reportError,
    calculateReportContentHash: jest.fn(() => "calculated-hash"),
    getChildById: jest.fn<(...args: any[]) => any>().mockResolvedValue({ id: "child-1", responsibleId: "owner", secondaryResponsibleId: null }),
    findAssociationByUserAndChild: jest.fn<(...args: any[]) => any>().mockResolvedValue({ id: "association" }),
    createAssociationChild: jest.fn<(...args: any[]) => any>(),
    listReportAggregatesByChild: jest.fn<(...args: any[]) => any>(),
    loadReportAggregate: jest.fn<(...args: any[]) => any>(),
    createReportWithInitialRevision: jest.fn<(...args: any[]) => any>(),
    updateDraftRevision: jest.fn<(...args: any[]) => any>().mockResolvedValue(true),
    submitDraftRevision: jest.fn<(...args: any[]) => any>().mockResolvedValue(true),
    createNextDraftRevision: jest.fn<(...args: any[]) => any>().mockResolvedValue(true),
    markRevisionRejected: jest.fn<(...args: any[]) => any>().mockResolvedValue(true),
    listReportRevisionHistory: jest.fn<(...args: any[]) => any>().mockResolvedValue([]),
    archiveReportAggregate: jest.fn<(...args: any[]) => any>().mockResolvedValue(true),
  };
}

describe("report revision workflow", () => {
  it("creates report and revision 1 as a draft in one repository operation", async () => {
    const deps = makeDeps();
    deps.createReportWithInitialRevision.mockResolvedValue(aggregate());
    const service = makeReportsChildrenServices(deps as any);
    const result = await service.createReportForChildService({
      requesterId: "author",
      requesterRole: "professional",
      childId: "child-1",
      dto: { title: " New draft " },
    });
    expect(deps.createReportWithInitialRevision).toHaveBeenCalledWith(expect.objectContaining({
      title: "New draft",
      contentHash: "calculated-hash",
    }));
    expect(result.lifecycle).toEqual(expect.objectContaining({ status: "DRAFT", currentRevisionNumber: 1 }));
  });

  it("edits only the current draft and recalculates its hash", async () => {
    const deps = makeDeps();
    deps.loadReportAggregate.mockResolvedValueOnce(aggregate()).mockResolvedValueOnce(aggregate({ revisions: [{ ...draft, title: "Updated" }] }));
    const service = makeReportsChildrenServices(deps as any);
    await service.updateReportService({ requesterId: "author", requesterRole: "professional", reportId: "report-1", dto: { title: " Updated " } });
    expect(deps.updateDraftRevision).toHaveBeenCalledWith(expect.objectContaining({ title: "Updated", revisionNumber: 1, contentHash: "calculated-hash" }));

    deps.loadReportAggregate.mockReset().mockResolvedValue(aggregate({ revisions: [{ ...draft, status: "SUBMITTED" }] }));
    await expect(service.updateReportService({ requesterId: "author", requesterRole: "professional", reportId: "report-1", dto: { title: "No" } })).rejects.toMatchObject({ code: "REPORT_NOT_EDITABLE" });
  });

  it("submits a draft once and rejects a concurrent or repeated transition", async () => {
    const deps = makeDeps();
    deps.loadReportAggregate.mockResolvedValue(aggregate());
    deps.submitDraftRevision.mockResolvedValue(false);
    const service = makeReportsChildrenServices(deps as any);
    await expect(service.submitReportService({ requesterId: "author", requesterRole: "professional", reportId: "report-1" })).rejects.toMatchObject({ code: "REPORT_REVISION_CONFLICT" });
    expect(deps.submitDraftRevision).toHaveBeenCalledWith(expect.objectContaining({ revisionNumber: 1, contentHash: "calculated-hash" }));
  });

  it("shows a published revision to ordinary viewers while the author sees the new draft", async () => {
    const deps = makeDeps();
    const published = { ...draft, id: "published", status: "VALIDATED", title: "Published" };
    const working = { ...draft, id: "working", revisionNumber: 2, title: "Working" };
    const report = aggregate({ currentRevisionNumber: 2, publishedRevisionNumber: 1, revisions: [working, published] });
    deps.loadReportAggregate.mockResolvedValue(report);
    const service = makeReportsChildrenServices(deps as any);

    const authorView = await service.getReportByIdService({ requesterId: "author", requesterRole: "professional", reportId: "report-1" });
    const viewerView = await service.getReportByIdService({ requesterId: "owner", requesterRole: "common", reportId: "report-1" });
    expect(authorView.revision.title).toBe("Working");
    expect(authorView.lifecycle.hasUnpublishedChanges).toBe(true);
    expect(viewerView.revision.title).toBe("Published");
  });

  it("creates the next draft from the unchanged published revision with optimistic concurrency", async () => {
    const deps = makeDeps();
    const published = { ...draft, status: "VALIDATED", title: "Published" };
    deps.loadReportAggregate
      .mockResolvedValueOnce(aggregate({ publishedRevisionNumber: 1, revisions: [published] }))
      .mockResolvedValueOnce(aggregate({ currentRevisionNumber: 2, publishedRevisionNumber: 1, revisions: [{ ...draft, revisionNumber: 2 }, published] }));
    const service = makeReportsChildrenServices(deps as any);
    await service.createNextRevisionService({ requesterId: "author", requesterRole: "professional", reportId: "report-1" });
    expect(deps.createNextDraftRevision).toHaveBeenCalledWith(expect.objectContaining({ expectedCurrentRevisionNumber: 1, baseRevision: published }));
  });

  it("archives the aggregate without deleting revision history", async () => {
    const deps = makeDeps();
    deps.loadReportAggregate.mockResolvedValue(aggregate());
    const service = makeReportsChildrenServices(deps as any);
    await expect(service.deleteReportService({ requesterId: "author", requesterRole: "professional", reportId: "report-1" })).resolves.toEqual({ id: "report-1" });
    expect(deps.archiveReportAggregate).toHaveBeenCalledWith({ reportId: "report-1", archivedById: "author" });
    expect(deps.listReportRevisionHistory).not.toHaveBeenCalled();
  });
});
