import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fileURLToPath } from "node:url";
import { calculateReportContentHash } from "../../../../src/utils/crypto/contentHash.js";

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
  reportsChild: { create: jest.fn<(...args: any[]) => any>(), findUnique: jest.fn<(...args: any[]) => any>(), updateMany: jest.fn<(...args: any[]) => any>() },
  reportRevision: { create: jest.fn<(...args: any[]) => any>(), updateMany: jest.fn<(...args: any[]) => any>() },
  reportValidation: { create: jest.fn<(...args: any[]) => any>() },
  securityAuditEvent: { create: jest.fn<(...args: any[]) => any>() },
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
  reportValidation: {
    findUnique: jest.fn<(...args: any[]) => any>(),
    findFirst: jest.fn<(...args: any[]) => any>(),
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
    tx.reportValidation.create.mockResolvedValue({ id: "validation-1" });
    tx.securityAuditEvent.create.mockResolvedValue({ id: "audit-1" });
    prisma.reportValidation.findUnique.mockResolvedValue(null);
    prisma.reportValidation.findFirst.mockResolvedValue(null);
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

  it("validates the exact submitted revision and supersedes the prior publication atomically", async () => {
    const content = { title: "Revision 2", behavior: "Observed", difficulty: null, recommendation: "Continue" };
    const hash = calculateReportContentHash(content);
    tx.reportsChild.findUnique.mockResolvedValue({
      id: "report-1",
      userId: "author-1",
      archivedAt: null,
      currentRevisionNumber: 2,
      publishedRevisionNumber: 1,
      revisions: [{
        id: "revision-2",
        revisionNumber: 2,
        status: "SUBMITTED",
        ...content,
        contentHash: hash,
        validations: [],
      }],
    });

    await expect(repository.validateReportRevisionTransaction({
      reportId: "report-1",
      revisionId: "revision-2",
      expectedContentHash: hash,
      validatorId: "author-1",
      factorId: "factor-1",
      method: "TOTP",
      type: "AUTHOR_ATTESTATION",
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
      requestId: "request-1",
      idempotentReplay: false,
    })).resolves.toEqual({ status: "VALIDATED", validationId: "validation-1" });

    expect(tx.reportRevision.updateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({ revisionNumber: 1, status: "VALIDATED" }),
      data: { status: "SUPERSEDED" },
    }));
    expect(tx.reportRevision.updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({ id: "revision-2", status: "SUBMITTED" }),
      data: { status: "VALIDATED" },
    }));
    expect(tx.reportValidation.create).toHaveBeenCalledTimes(1);
    expect(tx.securityAuditEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ eventType: "REPORT_AUTHOR_ATTESTED", resourceId: "revision-2" }),
    }));
  });

  it("rejects a changed content hash before writing validation", async () => {
    const content = { title: "Submitted", behavior: null, difficulty: null, recommendation: null };
    tx.reportsChild.findUnique.mockResolvedValue({
      id: "report-1",
      userId: "author-1",
      archivedAt: null,
      currentRevisionNumber: 1,
      publishedRevisionNumber: null,
      revisions: [{ id: "revision-1", revisionNumber: 1, status: "SUBMITTED", ...content, contentHash: calculateReportContentHash(content), validations: [] }],
    });
    const result = await repository.validateReportRevisionTransaction({
      reportId: "report-1", revisionId: "revision-1", expectedContentHash: "changed",
      validatorId: "author-1", factorId: "factor-1", method: "TOTP", type: "AUTHOR_ATTESTATION",
      idempotencyKey: "00000000-0000-4000-8000-000000000001", requestId: "request-1", idempotentReplay: false,
    });
    expect(result).toEqual({ status: "REPORT_CONTENT_HASH_MISMATCH" });
    expect(tx.reportValidation.create).not.toHaveBeenCalled();
  });

  it("returns the existing result for an exact idempotent retry without a second transaction", async () => {
    prisma.reportValidation.findUnique.mockResolvedValue({
      id: "validation-1",
      revisionId: "revision-1",
      validatorId: "author-1",
      type: "AUTHOR_ATTESTATION",
      revision: { reportId: "report-1" },
    });
    const result = await repository.validateReportRevisionTransaction({
      reportId: "report-1", revisionId: "revision-1", expectedContentHash: "hash",
      validatorId: "author-1", factorId: "factor-1", method: "TOTP", type: "AUTHOR_ATTESTATION",
      idempotencyKey: "00000000-0000-4000-8000-000000000001", requestId: "request-1", idempotentReplay: true,
    });
    expect(result).toEqual({ status: "IDEMPOTENT", validationId: "validation-1" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("maps a concurrent duplicate to one existing validation record", async () => {
    prisma.$transaction.mockRejectedValue({ code: "P2002" });
    prisma.reportValidation.findFirst.mockResolvedValue({
      id: "validation-1",
      validatorId: "author-1",
      idempotencyKey: "another-key",
    });
    const result = await repository.validateReportRevisionTransaction({
      reportId: "report-1", revisionId: "revision-1", expectedContentHash: "hash",
      validatorId: "author-1", factorId: "factor-1", method: "TOTP", type: "AUTHOR_ATTESTATION",
      idempotencyKey: "00000000-0000-4000-8000-000000000001", requestId: "request-1", idempotentReplay: false,
    });
    expect(result).toEqual({ status: "REPORT_ALREADY_VALIDATED" });
    expect(prisma.reportValidation.findFirst).toHaveBeenCalledTimes(1);
  });
});
