-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "AuthProvider" AS ENUM ('local', 'google');
CREATE TYPE "UserRole" AS ENUM ('admin', 'common', 'enterprise', 'professional', 'therapist');
CREATE TYPE "FamilyRole" AS ENUM ('child', 'enterprise', 'manager', 'therapist', 'professional');

CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'done', 'canceled');

-- AppointmentStatus (your schema uses it; ensure your prisma enum matches these values)
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'completed', 'canceled', 'no_show');

-- Tables

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT,
  "password_hash" TEXT,
  "provider" "AuthProvider" NOT NULL DEFAULT 'local',
  "google_id" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'common',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "families" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- In your schema Family.updatedAt is @updatedAt (no default in DB).
  -- If you WANT default on creation, set it to DEFAULT CURRENT_TIMESTAMP too.
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "family_members" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "family_id" UUID NOT NULL,
  "role" "FamilyRole" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "therapist_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,

  "status" "TaskStatus" NOT NULL DEFAULT 'pending',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "feedback" TEXT,
  "note" TEXT,

  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "appointments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "therapist_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,

  "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
  "title" TEXT,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,

  "note" TEXT,
  "feedback" TEXT,

  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- Indexes (uniques + normal)

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
CREATE INDEX "users_provider_idx" ON "users"("provider");
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");
CREATE INDEX "refresh_tokens_revoked_at_idx" ON "refresh_tokens"("revoked_at");

CREATE INDEX "families_created_at_idx" ON "families"("created_at");

CREATE UNIQUE INDEX "family_members_user_id_family_id_role_key"
ON "family_members"("user_id", "family_id", "role");
CREATE INDEX "family_members_family_id_idx" ON "family_members"("family_id");
CREATE INDEX "family_members_family_id_role_idx" ON "family_members"("family_id", "role");
CREATE INDEX "family_members_user_id_idx" ON "family_members"("user_id");

CREATE INDEX "tasks_therapist_id_idx" ON "tasks"("therapist_id");
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_created_at_idx" ON "tasks"("created_at");

CREATE INDEX "appointments_therapist_id_starts_at_idx" ON "appointments"("therapist_id", "starts_at");
CREATE INDEX "appointments_user_id_starts_at_idx" ON "appointments"("user_id", "starts_at");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");
CREATE INDEX "appointments_starts_at_idx" ON "appointments"("starts_at");

-- Foreign Keys

ALTER TABLE "refresh_tokens"
ADD CONSTRAINT "refresh_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "family_members"
ADD CONSTRAINT "family_members_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "family_members"
ADD CONSTRAINT "family_members_family_id_fkey"
FOREIGN KEY ("family_id") REFERENCES "families"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_therapist_id_fkey"
FOREIGN KEY ("therapist_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_therapist_id_fkey"
FOREIGN KEY ("therapist_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
