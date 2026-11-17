import { prisma } from "../src/infra/database/prisma/client.js";
import { calculateReportContentHash } from "../src/utils/crypto/contentHash.js";

const BATCH_SIZE = 100;
const verifyOnly = process.argv.includes("--verify");

async function verifyBackfill() {
  const [totalReports, reportsWithRevision, missingHashRows, duplicateGroups, invalidAggregates, contentMismatchRows] = await Promise.all([
    prisma.reportsChild.count(),
    prisma.reportsChild.count({ where: { revisions: { some: {} } } }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM report_revisions
      WHERE content_hash IS NULL
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT report_id, revision_number
        FROM report_revisions
        GROUP BY report_id, revision_number
        HAVING COUNT(*) > 1
      ) duplicates
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM reports_children
      WHERE current_revision_number IS NULL
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM reports_children report
      JOIN report_revisions revision
        ON revision.report_id = report.id
       AND revision.revision_number = 1
       AND revision.status = 'LEGACY_UNVALIDATED'
      WHERE report.title IS DISTINCT FROM revision.title
         OR report.behavior IS DISTINCT FROM revision.behavior
         OR report.difficulty IS DISTINCT FROM revision.difficulty
         OR report.recommendation IS DISTINCT FROM revision.recommendation
    `,
  ]);

  const missingHashes = Number(missingHashRows[0]?.count ?? 0n);
  const duplicateCount = Number(duplicateGroups[0]?.count ?? 0n);
  const invalidAggregateCount = Number(invalidAggregates[0]?.count ?? 0n);
  const contentMismatches = Number(contentMismatchRows[0]?.count ?? 0n);
  const valid =
    totalReports === reportsWithRevision &&
    missingHashes === 0 &&
    duplicateCount === 0 &&
    invalidAggregateCount === 0 &&
    contentMismatches === 0;

  console.info({ totalReports, reportsWithRevision, missingHashes, duplicateCount, invalidAggregates: invalidAggregateCount, contentMismatches, valid });
  if (!valid) throw new Error("Report revision backfill verification failed");
}

async function backfill() {
  let cursor: string | undefined;
  let scanned = 0;
  let migrated = 0;
  let skipped = 0;

  while (true) {
    const reports = await prisma.reportsChild.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        userId: true,
        title: true,
        behavior: true,
        difficulty: true,
        recommendation: true,
        revisions: { where: { revisionNumber: 1 }, select: { id: true }, take: 1 },
      },
    });
    if (reports.length === 0) break;

    for (const report of reports) {
      scanned += 1;
      if (report.revisions.length > 0) {
        skipped += 1;
        continue;
      }

      const contentHash = calculateReportContentHash(report);
      await prisma.$transaction(async (tx) => {
        const existing = await tx.reportRevision.findUnique({
          where: { reportId_revisionNumber: { reportId: report.id, revisionNumber: 1 } },
          select: { id: true },
        });
        if (existing) return;

        await tx.reportRevision.create({
          data: {
            reportId: report.id,
            revisionNumber: 1,
            createdById: report.userId,
            status: "LEGACY_UNVALIDATED",
            title: report.title,
            behavior: report.behavior,
            difficulty: report.difficulty,
            recommendation: report.recommendation,
            contentHash,
          },
        });
        await tx.reportsChild.update({
          where: { id: report.id },
          data: { currentRevisionNumber: 1 },
        });
      });
      migrated += 1;
    }

    cursor = reports.at(-1)!.id;
  }

  console.info({ scanned, migrated, skipped });
}

try {
  if (!verifyOnly) await backfill();
  await verifyBackfill();
} finally {
  await prisma.$disconnect();
}
