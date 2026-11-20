-- Preserve existing aggregate deletion semantics: removing a report revision also
-- removes its validation row, while ordinary report workflows remain immutable.
ALTER TABLE "report_validations" DROP CONSTRAINT "report_validations_revision_id_fkey";
ALTER TABLE "report_validations" ADD CONSTRAINT "report_validations_revision_id_fkey"
  FOREIGN KEY ("revision_id") REFERENCES "report_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
