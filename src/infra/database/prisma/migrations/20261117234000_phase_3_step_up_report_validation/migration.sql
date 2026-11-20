-- CreateEnum
CREATE TYPE "ReportValidationType" AS ENUM ('AUTHOR_ATTESTATION');

-- CreateEnum
CREATE TYPE "MfaMethod" AS ENUM ('TOTP', 'RECOVERY_CODE');

-- CreateEnum
CREATE TYPE "SecurityAuditOutcome" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateTable
CREATE TABLE "report_validations" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "validator_id" UUID NOT NULL,
    "totp_factor_id" UUID,
    "type" "ReportValidationType" NOT NULL,
    "method" "MfaMethod" NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "validated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" UUID,
    "revocation_reason" TEXT,

    CONSTRAINT "report_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_audit_events" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "event_type" TEXT NOT NULL,
    "outcome" "SecurityAuditOutcome" NOT NULL,
    "method" "MfaMethod",
    "resource_type" TEXT,
    "resource_id" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_validations_idempotency_key_key" ON "report_validations"("idempotency_key");
CREATE INDEX "report_validations_validator_id_validated_at_idx" ON "report_validations"("validator_id", "validated_at");
CREATE INDEX "report_validations_totp_factor_id_idx" ON "report_validations"("totp_factor_id");
CREATE INDEX "report_validations_revoked_at_idx" ON "report_validations"("revoked_at");
CREATE UNIQUE INDEX "report_validations_revision_id_type_key" ON "report_validations"("revision_id", "type");
CREATE INDEX "security_audit_events_actor_user_id_created_at_idx" ON "security_audit_events"("actor_user_id", "created_at");
CREATE INDEX "security_audit_events_event_type_created_at_idx" ON "security_audit_events"("event_type", "created_at");
CREATE INDEX "security_audit_events_resource_type_resource_id_idx" ON "security_audit_events"("resource_type", "resource_id");

-- AddForeignKey
ALTER TABLE "report_validations" ADD CONSTRAINT "report_validations_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "report_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "report_validations" ADD CONSTRAINT "report_validations_validator_id_fkey" FOREIGN KEY ("validator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "report_validations" ADD CONSTRAINT "report_validations_totp_factor_id_fkey" FOREIGN KEY ("totp_factor_id") REFERENCES "user_totp_factors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "report_validations" ADD CONSTRAINT "report_validations_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "security_audit_events" ADD CONSTRAINT "security_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
