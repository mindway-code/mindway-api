# Phase 1 — MFA foundation

> Status: planned  
> Environment: development only  
> Audience: junior backend developer  
> Depends on: Phase 0 completed

## Goal

Add per-user TOTP enrollment compatible with Google Authenticator, one-time recovery codes, encrypted secret storage, strict Redis-backed security state, and lifecycle endpoints. This phase does not protect report validation yet.

## Safety rules

- A TOTP secret belongs to one user. Never create one application-wide shared secret.
- Never log a TOTP code, recovery code, decrypted secret, QR payload, `otpauth://` URI, or future step-up proof.
- Do not store a TOTP secret as plaintext.
- Do not hash the TOTP secret; verification requires decrypting it.
- Use Redis in fail-closed mode for security operations. Do not reuse the cache helper that silently skips failures.
- Keep all real secret values in ignored `.env.dev`; only placeholders belong in `.env.dev.example`.
- Make only additive development migrations. Do not reset the stable database.

## Target structure

```text
src/
  api/v1/modules/mfa/
    mfa.types.ts
    mfa.service.ts
    mfa.controller.ts
    mfa.routes.ts
  api/v1/validators/mfa.validator.ts
  core/middlewares/mfaRateLimit.middleware.ts
  infra/database/repositories/mfa.repository.ts
  infra/redis/securityStore.ts
  utils/crypto/totp.ts
  utils/crypto/secretEncryption.ts
  utils/crypto/recoveryCodes.ts
```

Generic cryptographic operations belong in `utils`. Enrollment rules and orchestration belong in the MFA service. Prisma access belongs in the repository.

## Task 1 — Add and validate configuration

Add these values to `src/core/config/env.ts` and sanitized examples to `.env.dev.example` and `.env.prod.example`:

```dotenv
MFA_ISSUER=MINDWAY
MFA_TOTP_ENCRYPTION_KEY=replace_with_base64_32_byte_key
MFA_TOTP_ENCRYPTION_KEY_VERSION=1
MFA_RECOVERY_CODE_PEPPER=replace_with_independent_long_secret
MFA_ENROLLMENT_TTL_SECONDS=600
MFA_ATTEMPT_WINDOW_SECONDS=300
MFA_ATTEMPT_MAX=5
```

Validation requirements:

- decode the encryption key and confirm it is exactly 32 bytes;
- require a positive key version;
- require positive TTL and attempt values;
- do not print secret values when environment parsing fails.

Generate local development secrets outside source control. Never copy the development key to production.

## Task 2 — Add the TOTP dependency and wrapper

Use a maintained RFC 6238-compatible package such as `otplib`, after confirming the selected version supports the repository's Node 20 runtime.

Do not call the third-party package directly from controllers or services. Wrap it in `src/utils/crypto/totp.ts` with explicit functions:

```ts
generateTotpSecret(): string;
buildTotpUri(params): string;
verifyTotpCode(params): TotpVerificationResult;
```

Use:

- 20 random secret bytes;
- Base32 without padding;
- SHA-1 for broad authenticator compatibility;
- six digits;
- a 30-second period;
- at most one adjacent time step.

The verification result must include the matched time step so the service can prevent reuse.

## Task 3 — Encrypt TOTP secrets

In `secretEncryption.ts`, implement AES-256-GCM using Node's `crypto` module.

Persist separately:

- ciphertext;
- random IV/nonce;
- authentication tag;
- encryption key version.

Requirements:

- generate a fresh IV for every encryption;
- fail if authentication-tag verification fails;
- expose narrow `encryptSecret` and `decryptSecret` functions;
- keep support for `keyVersion` so key rotation can be added later;
- never return decrypted material in errors.

Add unit tests for round-trip encryption, wrong keys, modified ciphertext, modified IV, and modified authentication tag.

## Task 4 — Add Prisma models

Add `UserTotpFactor` and `MfaRecoveryCode` as designed in the architecture plan.

Important invariants:

- one current TOTP factor per user;
- cascade factor and recovery-code deletion when the user is deleted;
- recovery codes have a `usedAt` timestamp;
- the factor stores `lastUsedTimeStep`;
- `User` receives an optional `totpFactor` relation;
- timestamps use mapped snake_case database names.

Create a named additive migration such as `phase_1_mfa_foundation`. Review the generated SQL before applying it.

## Task 5 — Implement recovery codes

Generate a small set of high-entropy, human-readable codes, for example ten codes. Format them for readability, but normalize them before verification.

Store only a keyed HMAC digest made with `MFA_RECOVERY_CODE_PEPPER`. Recovery codes contain sufficient randomness and do not need slow password hashing.

Requirements:

- return plaintext recovery codes only once after enrollment or regeneration;
- compare digests in constant-time where applicable;
- mark a used code in a Prisma transaction;
- never return used codes again;
- return only `recoveryCodesRemaining` in status responses.

## Task 6 — Add strict Redis security storage

Create `src/infra/redis/securityStore.ts`. It may share the underlying Redis connection, but it must not inherit cache semantics that swallow connection failures.

It must support:

- storing a pending enrollment with TTL;
- loading and deleting a pending enrollment;
- incrementing an attempt counter atomically;
- setting expiration on the first failed attempt;
- rejecting security operations if Redis is unavailable.

Suggested keys:

```text
mfa:enrollment:<enrollment-id>
mfa:attempt:<user-id>:<ip-hash>
```

Do not include email, codes, or secrets in Redis key names.

## Task 7 — Implement enrollment endpoints

Add:

```http
GET    /api/auth/mfa
POST   /api/auth/mfa/totp/enrollments
POST   /api/auth/mfa/totp/enrollments/:id/confirm
POST   /api/auth/mfa/recovery-codes/regenerate
DELETE /api/auth/mfa/totp
```

All endpoints require `authMiddleware`. Enrollment start also requires recent password reauthentication from Phase 0. For the first implementation, return a clear error for Google-only accounts until provider reauthentication exists.

### Start enrollment

1. Verify current password or a narrowly scoped recent-reauthentication grant.
2. Refuse to replace an enabled factor without an additional MFA-protected replacement flow.
3. Generate the secret.
4. Encrypt the pending secret.
5. Store it in Redis for ten minutes, bound to the authenticated user.
6. Return the enrollment ID, manual Base32 secret, and `otpauth://` URI.

The API returns the URI; the frontend must render the QR locally. Do not send the URI to an external QR service.

### Confirm enrollment

1. Load the pending enrollment and verify it belongs to the authenticated user.
2. Decrypt the pending secret.
3. Verify the submitted six-digit code.
4. In one database transaction, create the factor, store recovery-code digests, and set `lastUsedTimeStep`.
5. Delete the pending Redis record.
6. Return recovery codes once.

### Disable or regenerate recovery codes

These operations must require current password plus an MFA code in Phase 1. Phase 3 will replace this direct flow with reusable step-up grants.

## Task 8 — Add rate limiting and errors

Add explicit errors such as:

```text
MFA_NOT_CONFIGURED
MFA_ALREADY_CONFIGURED
MFA_REAUTHENTICATION_REQUIRED
MFA_ENROLLMENT_EXPIRED
MFA_CODE_INVALID
MFA_CODE_REUSED
MFA_RATE_LIMITED
MFA_RECOVERY_CODE_INVALID
```

Limit verification by user and IP. Use a temporary cooldown, not a permanent account lock.

Update the Angular interceptor later so these errors never trigger access-token refresh.

## Task 9 — Documentation and tests

Update OpenAPI with all request/response shapes and error cases.

Required tests:

- fixed-time TOTP generation and verification;
- current and permitted adjacent time steps;
- reused time-step rejection;
- encryption tamper detection;
- enrollment ownership and expiration;
- recovery-code one-time use;
- attempt limits;
- Redis failure is fail-closed;
- secrets never appear in response errors or captured logs;
- repository tests for factor and recovery-code writes.

## Definition of done

- [ ] A local user can enroll Google Authenticator-compatible TOTP.
- [ ] Enrollment is pending until the first code is confirmed.
- [ ] Secrets are encrypted at rest.
- [ ] The same TOTP time step cannot be reused.
- [ ] Recovery codes are returned once and consumed once.
- [ ] Security Redis failures deny the operation.
- [ ] All endpoints are authenticated, validated, rate-limited, tested, and documented.
- [ ] Reports are not MFA-protected yet.
- [ ] No production environment was changed.

## Dev deploy

This phase changes dependencies, environment variables, and the development database schema. PostgreSQL and Redis must keep their existing volumes.

### 1. Preflight

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml ps
```

Confirm PostgreSQL and Redis are healthy. Preserve `.env.dev` and take a local database backup according to the team's normal development backup procedure before applying the migration.

### 2. Update development secrets

Add real development-only MFA values to the ignored `.env.dev`. Add placeholders only to `.env.dev.example`.

Usually `compose.dev.yaml` does not need new entries because the API already loads `.env.dev`. Change Compose only if the container is not receiving the new variables.

### 3. Install dependencies and refresh the container volume

After `package.json` and `package-lock.json` are updated:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml build api
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm ci
```

The second command updates the named `/app/node_modules` development volume that otherwise overlays dependencies installed in the image.

### 4. Create and apply the development migration

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npx prisma validate
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npx prisma migrate dev --name phase_1_mfa_foundation
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm run db:generate
```

Review the generated SQL. It should add tables, indexes, and foreign keys without dropping existing report, user, refresh-token, or child data.

### 5. Start only the new API image

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml up -d --no-deps api
```

Do not run `down -v`, do not delete `api_postgres_dev_data`, and do not delete `api_redis_data`.

### 6. Validate

```powershell
npm run lint
npm run lint:test
npm test
npm run build
docker compose --env-file .env.dev -f compose.dev.yaml logs --tail 100 api
```

Smoke-test status, enrollment start, QR/manual enrollment, confirmation, invalid code, recovery code, and disable behavior with a development account.

### Rollback

Do not blindly delete tables after they contain enrolled factors. Prefer a forward migration or restore the pre-phase local backup. Reverting only application code while the additive tables remain is acceptable if the old code does not reference them.

Previous: [Phase 0 — Establish trust boundaries](./phase-0-establish-trust-boundaries.md)  
Next: [Phase 2 — Report revision workflow](./phase-2-report-revision-workflow.md)
