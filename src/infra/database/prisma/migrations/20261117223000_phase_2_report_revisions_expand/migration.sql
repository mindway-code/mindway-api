-- CreateEnum
CREATE TYPE "ReportRevisionStatus" AS ENUM (
    'LEGACY_UNVALIDATED',
    'DRAFT',
    'SUBMITTED',
    'VALIDATED',
    'REJECTED',
    'SUPERSEDED'
);

-- AlterTable: expand only; existing report content remains untouched.
ALTER TABLE "reports_children"
    ADD COLUMN "current_revision_number" INTEGER,
    ADD COLUMN "published_revision_number" INTEGER,
    ADD COLUMN "archived_at" TIMESTAMP(3),
    ADD COLUMN "archived_by_id" UUID;

-- CreateTable
CREATE TABLE "report_revisions" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "created_by_id" UUID NOT NULL,
    "status" "ReportRevisionStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "behavior" TEXT,
    "difficulty" TEXT,
    "recommendation" TEXT,
    "content_hash" TEXT,
    "submitted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_children_archived_at_idx" ON "reports_children"("archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "report_revisions_report_id_revision_number_key" ON "report_revisions"("report_id", "revision_number");

-- CreateIndex
CREATE INDEX "report_revisions_report_id_status_idx" ON "report_revisions"("report_id", "status");

-- CreateIndex
CREATE INDEX "report_revisions_created_by_id_idx" ON "report_revisions"("created_by_id");

-- AddForeignKey
ALTER TABLE "reports_children" ADD CONSTRAINT "reports_children_archived_by_id_fkey" FOREIGN KEY ("archived_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_revisions" ADD CONSTRAINT "report_revisions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports_children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_revisions" ADD CONSTRAINT "report_revisions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
