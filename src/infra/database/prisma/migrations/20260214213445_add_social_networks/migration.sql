-- Optional safety (only if you're not sure it's already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "social_networks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_network_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "social_network_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_network_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_networks_name_key" ON "social_networks"("name");

-- CreateIndex
CREATE INDEX "social_networks_created_at_idx" ON "social_networks"("created_at");

-- CreateIndex
CREATE INDEX "social_network_users_social_network_id_idx" ON "social_network_users"("social_network_id");

-- CreateIndex
CREATE INDEX "social_network_users_user_id_idx" ON "social_network_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_network_users_social_network_id_user_id_key"
ON "social_network_users"("social_network_id", "user_id");

-- AddForeignKey
ALTER TABLE "social_network_users"
ADD CONSTRAINT "social_network_users_social_network_id_fkey"
FOREIGN KEY ("social_network_id") REFERENCES "social_networks"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_network_users"
ADD CONSTRAINT "social_network_users_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
