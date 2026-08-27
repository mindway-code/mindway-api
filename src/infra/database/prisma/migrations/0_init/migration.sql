-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('local', 'google');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'completed', 'canceled', 'no_show');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'common', 'enterprise', 'professional', 'therapist');

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('child', 'enterprise', 'manager', 'therapist', 'professional');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'done', 'canceled');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "families" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "role" "FamilyRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "social_networks" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_network_users" (
    "id" UUID NOT NULL,
    "social_network_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_network_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID,
    "social_network_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" UUID NOT NULL,
    "responsible_id" UUID NOT NULL,
    "secondary_responsible_id" UUID,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "observation" TEXT,
    "access_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "association_children" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "association_children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports_children" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_role" "UserRole" NOT NULL,
    "title" TEXT NOT NULL,
    "behavior" TEXT,
    "difficulty" TEXT,
    "recommendation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamneses" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "general_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamneses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_births" (
    "id" UUID NOT NULL,
    "anamnesis_id" UUID NOT NULL,
    "gestational_weeks" INTEGER,
    "birth_type" TEXT,
    "birth_weight_grams" INTEGER,
    "birth_height_centimeters" INTEGER,
    "apgar_one_minute" INTEGER,
    "apgar_five_minutes" INTEGER,
    "birth_complication" TEXT,
    "hospitalization_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamnesis_births_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_motor_developments" (
    "id" UUID NOT NULL,
    "anamnesis_id" UUID NOT NULL,
    "neck_control_age_months" INTEGER,
    "sitting_age_months" INTEGER,
    "crawling_age_months" INTEGER,
    "first_steps_age_months" INTEGER,
    "fine_coordination" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamnesis_motor_developments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_language_communications" (
    "id" UUID NOT NULL,
    "anamnesis_id" UUID NOT NULL,
    "first_words_age_months" INTEGER,
    "full_sentences_age_months" INTEGER,
    "comprehension" TEXT,
    "current_communication" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamnesis_language_communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_healths" (
    "id" UUID NOT NULL,
    "anamnesis_id" UUID NOT NULL,
    "diagnosis" TEXT,
    "medication" TEXT,
    "allergies" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamnesis_healths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_behaviors" (
    "id" UUID NOT NULL,
    "anamnesis_id" UUID NOT NULL,
    "concentration_difficulty" TEXT,
    "interaction" TEXT,
    "activity_preference" TEXT,
    "anxiety" TEXT,
    "hyperactivity" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamnesis_behaviors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_routines" (
    "id" UUID NOT NULL,
    "anamnesis_id" UUID NOT NULL,
    "wakes_up_at" TEXT,
    "therapies" TEXT,
    "school_period" TEXT,
    "extra_activity" TEXT,
    "sleeps_at" TEXT,
    "routine_observation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamnesis_routines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_provider_idx" ON "users"("provider");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_revoked_at_idx" ON "refresh_tokens"("revoked_at");

-- CreateIndex
CREATE INDEX "appointments_therapist_id_starts_at_idx" ON "appointments"("therapist_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_user_id_starts_at_idx" ON "appointments"("user_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_starts_at_idx" ON "appointments"("starts_at");

-- CreateIndex
CREATE INDEX "families_created_at_idx" ON "families"("created_at");

-- CreateIndex
CREATE INDEX "family_members_family_id_idx" ON "family_members"("family_id");

-- CreateIndex
CREATE INDEX "family_members_family_id_role_idx" ON "family_members"("family_id", "role");

-- CreateIndex
CREATE INDEX "family_members_user_id_idx" ON "family_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_user_id_family_id_role_key" ON "family_members"("user_id", "family_id", "role");

-- CreateIndex
CREATE INDEX "tasks_therapist_id_idx" ON "tasks"("therapist_id");

-- CreateIndex
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_created_at_idx" ON "tasks"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "social_networks_name_key" ON "social_networks"("name");

-- CreateIndex
CREATE INDEX "social_networks_created_at_idx" ON "social_networks"("created_at");

-- CreateIndex
CREATE INDEX "social_network_users_social_network_id_idx" ON "social_network_users"("social_network_id");

-- CreateIndex
CREATE INDEX "social_network_users_user_id_idx" ON "social_network_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_network_users_social_network_id_user_id_key" ON "social_network_users"("social_network_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_created_at_idx" ON "messages"("sender_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_recipient_id_created_at_idx" ON "messages"("recipient_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_social_network_id_created_at_idx" ON "messages"("social_network_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "children_access_code_key" ON "children"("access_code");

-- CreateIndex
CREATE INDEX "children_responsible_id_idx" ON "children"("responsible_id");

-- CreateIndex
CREATE INDEX "children_secondary_responsible_id_idx" ON "children"("secondary_responsible_id");

-- CreateIndex
CREATE INDEX "children_access_code_idx" ON "children"("access_code");

-- CreateIndex
CREATE INDEX "children_created_at_idx" ON "children"("created_at");

-- CreateIndex
CREATE INDEX "association_children_user_id_idx" ON "association_children"("user_id");

-- CreateIndex
CREATE INDEX "association_children_child_id_idx" ON "association_children"("child_id");

-- CreateIndex
CREATE INDEX "association_children_created_at_idx" ON "association_children"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "association_children_user_id_child_id_key" ON "association_children"("user_id", "child_id");

-- CreateIndex
CREATE INDEX "reports_children_child_id_idx" ON "reports_children"("child_id");

-- CreateIndex
CREATE INDEX "reports_children_user_id_idx" ON "reports_children"("user_id");

-- CreateIndex
CREATE INDEX "reports_children_user_role_idx" ON "reports_children"("user_role");

-- CreateIndex
CREATE INDEX "reports_children_created_at_idx" ON "reports_children"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "anamneses_child_id_key" ON "anamneses"("child_id");

-- CreateIndex
CREATE INDEX "anamneses_child_id_idx" ON "anamneses"("child_id");

-- CreateIndex
CREATE INDEX "anamneses_created_at_idx" ON "anamneses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "anamnesis_births_anamnesis_id_key" ON "anamnesis_births"("anamnesis_id");

-- CreateIndex
CREATE INDEX "anamnesis_births_anamnesis_id_idx" ON "anamnesis_births"("anamnesis_id");

-- CreateIndex
CREATE UNIQUE INDEX "anamnesis_motor_developments_anamnesis_id_key" ON "anamnesis_motor_developments"("anamnesis_id");

-- CreateIndex
CREATE INDEX "anamnesis_motor_developments_anamnesis_id_idx" ON "anamnesis_motor_developments"("anamnesis_id");

-- CreateIndex
CREATE UNIQUE INDEX "anamnesis_language_communications_anamnesis_id_key" ON "anamnesis_language_communications"("anamnesis_id");

-- CreateIndex
CREATE INDEX "anamnesis_language_communications_anamnesis_id_idx" ON "anamnesis_language_communications"("anamnesis_id");

-- CreateIndex
CREATE UNIQUE INDEX "anamnesis_healths_anamnesis_id_key" ON "anamnesis_healths"("anamnesis_id");

-- CreateIndex
CREATE INDEX "anamnesis_healths_anamnesis_id_idx" ON "anamnesis_healths"("anamnesis_id");

-- CreateIndex
CREATE UNIQUE INDEX "anamnesis_behaviors_anamnesis_id_key" ON "anamnesis_behaviors"("anamnesis_id");

-- CreateIndex
CREATE INDEX "anamnesis_behaviors_anamnesis_id_idx" ON "anamnesis_behaviors"("anamnesis_id");

-- CreateIndex
CREATE UNIQUE INDEX "anamnesis_routines_anamnesis_id_key" ON "anamnesis_routines"("anamnesis_id");

-- CreateIndex
CREATE INDEX "anamnesis_routines_anamnesis_id_idx" ON "anamnesis_routines"("anamnesis_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_network_users" ADD CONSTRAINT "social_network_users_social_network_id_fkey" FOREIGN KEY ("social_network_id") REFERENCES "social_networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_network_users" ADD CONSTRAINT "social_network_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_social_network_id_fkey" FOREIGN KEY ("social_network_id") REFERENCES "social_networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_secondary_responsible_id_fkey" FOREIGN KEY ("secondary_responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_children" ADD CONSTRAINT "association_children_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_children" ADD CONSTRAINT "association_children_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports_children" ADD CONSTRAINT "reports_children_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports_children" ADD CONSTRAINT "reports_children_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamneses" ADD CONSTRAINT "anamneses_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_births" ADD CONSTRAINT "anamnesis_births_anamnesis_id_fkey" FOREIGN KEY ("anamnesis_id") REFERENCES "anamneses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_motor_developments" ADD CONSTRAINT "anamnesis_motor_developments_anamnesis_id_fkey" FOREIGN KEY ("anamnesis_id") REFERENCES "anamneses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_language_communications" ADD CONSTRAINT "anamnesis_language_communications_anamnesis_id_fkey" FOREIGN KEY ("anamnesis_id") REFERENCES "anamneses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_healths" ADD CONSTRAINT "anamnesis_healths_anamnesis_id_fkey" FOREIGN KEY ("anamnesis_id") REFERENCES "anamneses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_behaviors" ADD CONSTRAINT "anamnesis_behaviors_anamnesis_id_fkey" FOREIGN KEY ("anamnesis_id") REFERENCES "anamneses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_routines" ADD CONSTRAINT "anamnesis_routines_anamnesis_id_fkey" FOREIGN KEY ("anamnesis_id") REFERENCES "anamneses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

