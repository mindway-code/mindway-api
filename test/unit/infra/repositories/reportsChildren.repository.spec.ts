import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fileURLToPath } from "node:url";

const aggregate = {
  id: "report-1",
  childId: "child-1",
  userId: "author-1",
  userRole: "professional",
  currentRevisionNumber: 1,
  publishedRevisionNumber: null,
  archivedAt: null,
  archivedById: null,
  user: { id: "author-1", name: "Author", email: "author@example.com" },
  revisions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const tx = {
  reportsChild: { create: jest.fn<(...args: any[]) => any>(), updateMany: jest.fn<(...args: any[]) => any>() },
  reportRevision: { create: jest.fn<(...args: any[]) => any>(), updateMany: jest.fn<(...args: any[]) => any>() },
};
const prisma = {
  reportsChild: {
    findUnique: jest.fn<(...args: any[]) => any>(),
    findMany: jest.fn<(...args: any[]) => any>(),
    count: jest.fn<(...args: any[]) => any>(),
    updateMany: jest.fn<(...args: any[]) => any>(),
  },
  reportRevision: {
    findMany: jest.fn<(...args: any[]) => any>(),
    updateMany: jest.fn<(...args: any[]) => any>(),
  },
  $transaction: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../../src/infra/database/prisma/client.ts", import.meta.url)),
  () => ({ prisma }),
);
const repository = await import("../../../../src/infra/database/repositories/reportsChildren.repository.js");

describe("report revision repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (operation: any) => operation(tx));
    prisma.reportsChild.findUnique.mockResolvedValue(aggregate);
    tx.reportsChild.create.mockResolvedValue({ id: "report-1" });
    tx.reportRevision.create.mockResolvedValue({ id: "revision-1" });
    tx.reportRevision.updateMany.mockResolvedValue({ count: 1 });
    tx.reportsChild.updateMany.mockResolvedValue({ count: 1 });
    prisma.reportsChild.updateMany.mockResolvedValue({ count: 1 });
  });

  it("creates the aggregate and revision 1 in one transaction", async () => {
    await repository.createReportWithInitialRevision({
      childId: "child-1", userId: "author-1", userRole: "professional", title: "Draft",
      behavior: null, difficulty: null, recommendation: null, contentHash: "hash",
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.reportsChild.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ currentRevisionNumber: 1 }) }));
    expect(tx.reportRevision.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ revisionNumber: 1, status: "DRAFT", contentHash: "hash" }) }));
  });

  it("updates a draft and overlap columns atomically", async () => {
    await expect(repository.updateDraftRevision({
      reportId: "report-1", revisionNumber: 1, title: "Updated", behavior: null,
      difficulty: null, recommendation: null, contentHash: "new-hash",
    })).resolves.toBe(true);
    expect(tx.reportRevision.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "DRAFT" }) }));
    expect(tx.reportsChild.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: "Updated" }) }));
  });

  it("prevents concurrent next-revision creation with an optimistic aggregate update", async () => {
    tx.reportsChild.updateMany.mockResolvedValue({ count: 0 });
    await expect(repository.createNextDraftRevision({
      reportId: "report-1", createdById: "author-1", expectedCurrentRevisionNumber: 1,
      baseRevision: { id: "revision-1", reportId: "report-1", revisionNumber: 1, createdById: "author-1", status: "VALIDATED", title: "Published", behavior: null, difficulty: null, recommendation: null, contentHash: "hash", submittedAt: null, rejectedAt: null, rejectionReason: null, createdAt: new Date(), updatedAt: new Date() },
      contentHash: "hash",
    })).resolves.toBe(false);
    expect(tx.reportRevision.create).not.toHaveBeenCalled();
  });

  it("archives without deleting revisions", async () => {
    await expect(repository.archiveReportAggregate({ reportId: "report-1", archivedById: "admin-1" })).resolves.toBe(true);
    expect(prisma.reportsChild.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ archivedById: "admin-1" }) }));
    expect(tx.reportRevision.updateMany).not.toHaveBeenCalled();
  });
});
