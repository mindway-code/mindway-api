-- CreateTable
CREATE TABLE "user_totp_factors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "secret_ciphertext" TEXT NOT NULL,
    "secret_iv" TEXT NOT NULL,
    "secret_auth_tag" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL,
    "last_used_time_step" BIGINT,
    "enabled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_totp_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_recovery_codes" (
    "id" UUID NOT NULL,
    "factor_id" UUID NOT NULL,
    "digest" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mfa_recovery_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_totp_factors_user_id_key" ON "user_totp_factors"("user_id");

-- CreateIndex
CREATE INDEX "user_totp_factors_enabled_at_idx" ON "user_totp_factors"("enabled_at");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_recovery_codes_digest_key" ON "mfa_recovery_codes"("digest");

-- CreateIndex
CREATE INDEX "mfa_recovery_codes_factor_id_used_at_idx" ON "mfa_recovery_codes"("factor_id", "used_at");

-- AddForeignKey
ALTER TABLE "user_totp_factors" ADD CONSTRAINT "user_totp_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_recovery_codes" ADD CONSTRAINT "mfa_recovery_codes_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "user_totp_factors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
