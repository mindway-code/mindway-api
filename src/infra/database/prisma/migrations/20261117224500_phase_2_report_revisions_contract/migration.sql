-- Contract only after the versioned backfill has verified every report and hash.
ALTER TABLE "reports_children"
    ALTER COLUMN "current_revision_number" SET NOT NULL;

ALTER TABLE "report_revisions"
    ALTER COLUMN "content_hash" SET NOT NULL;
