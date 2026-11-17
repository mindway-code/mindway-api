# Phase 4 — Hardening and rollout

> Status: planned  
> Environment: development verification and rollout preparation only  
> Audience: junior developer working with senior review  
> Depends on: Phases 0 through 3 completed

## Goal

Prove that MFA and report validation are safe to operate before any future production rollout. Strengthen rate limits, key handling, recovery, auditability, observability, failure behavior, and operational documentation.

This phase does not authorize a production deployment. Production secrets, migrations, and feature enablement require a separate reviewed release plan and explicit approval.

## Safety rules

- Keep all testing in `APP_ENV=dev`.
- Never copy development MFA keys to production.
- Never print `.env.dev`, expanded Compose configuration, TOTP secrets, proofs, or recovery codes in tickets or logs.
- Never use local database reset as a normal rollout or rollback tool.
- Do not weaken fail-closed behavior to make a smoke test pass.
- Changes to cryptography, authentication, key rotation, or recovery require senior review.

## Task 1 — Complete the security review

Review each boundary:

### Enrollment

- Requires recent reauthentication.
- Pending enrollment expires.
- A user cannot overwrite an enabled factor without proving possession or using an approved recovery path.
- QR and manual secrets never reach logs or analytics.

### Verification

- Rate limits use shared Redis state.
- The same TOTP time step is rejected after use.
- Errors do not reveal whether a code was close, old, or associated with another account.
- Redis failure denies the operation.

### Recovery

- Recovery codes are high entropy, hashed with an independent pepper, and single-use.
- Regeneration invalidates every previous unused code.
- Administrative recovery requires a documented identity-verification process; an administrator must not be able to view or generate a user's TOTP secret.

### Report validation

- Proof is bound to the exact revision.
- Validation does not bypass report authorization.
- Validated content is immutable.
- Edits create a new draft.
- Archive and revocation preserve history.

Record findings and remediation tasks. Do not declare the feature ready while high-severity findings remain.

## Task 2 — Key rotation readiness

The database stores `keyVersion`; now document and test how it is used.

The application should support:

1. one active encryption key version for new writes;
2. one or more previous keys for decrypting existing factors during rotation;
3. re-encrypting factors to the active key after successful decryption or through a controlled maintenance job;
4. metrics for factors still using old keys;
5. removal of a previous key only after no database rows depend on it.

Do not implement a format that places a keyring directly in committed files. Development keys remain in `.env.dev`; future production keys belong in a managed secret store or KMS.

Test wrong, missing, old, and active key versions.

## Task 3 — Operational recovery procedures

Write a runbook for:

- lost authenticator with recovery codes;
- lost authenticator without recovery codes;
- compromised factor;
- compromised recovery code;
- unavailable Redis;
- database restored from backup;
- lost encryption key;
- severe server clock drift;
- suspected validation fraud;
- validation revocation.

Important outcomes:

- Losing the database alone does not reveal TOTP secrets without the encryption key.
- Losing the encryption key means affected users must re-enroll unless a protected backup exists.
- Restoring an older database backup may restore already-used recovery codes or old TOTP counters, so the recovery procedure must account for replay risk.

## Task 4 — Observability without secret leakage

Add structured metrics and sanitized logs for:

```text
mfa_enrollment_started
mfa_enrollment_completed
mfa_verification_succeeded
mfa_verification_failed
mfa_rate_limited
mfa_recovery_code_used
mfa_factor_disabled
step_up_grant_issued
step_up_grant_consumed
step_up_grant_rejected
report_validation_completed
report_validation_revoked
security_store_unavailable
```

Useful dimensions include environment, action, method, result, and error code. Avoid user email, report content, code values, secret values, proof values, and full IP addresses.

Verify log redaction by deliberately using recognizable fake secrets in development tests and confirming they do not appear in captured output.

## Task 5 — Rate-limit and abuse testing

Test:

- repeated invalid codes from one user and IP;
- one user across several IPs;
- several users behind one IP;
- concurrent requests using the same code;
- concurrent requests using the same proof;
- recovery-code brute force;
- enrollment creation spam;
- Redis reconnect behavior;
- API restart while grants exist;
- clock offset around a 30-second boundary.

Rate limits should slow abuse without permanently locking out legitimate users. Document the chosen limits and why.

## Task 6 — Idempotency and concurrency review

Confirm database constraints and transactions protect against:

- two revision submissions;
- two validations for the same revision and type;
- two recovery-code uses;
- two accepted uses of the same TOTP time step;
- two new revision numbers;
- duplicate retries with the same `Idempotency-Key`.

Run integration tests with concurrent promises, not only sequential unit tests.

## Task 7 — Feature flags and staged enablement

Add development configuration such as:

```dotenv
MFA_ENROLLMENT_ENABLED=true
REPORT_VALIDATION_ENABLED=false
```

Requirements:

- validate flags in `env.ts`;
- disabled routes return a stable feature-disabled error;
- disabling report validation must not hide existing validation history;
- enrollment and report validation can be enabled separately;
- flags are evaluated on the server, not trusted from the frontend.

Development rollout order:

1. Enable enrollment for administrators and test accounts.
2. Verify recovery and disable flows.
3. Enable report validation for selected professional test accounts.
4. Observe metrics and audit events.
5. Run failure simulations.
6. Prepare, but do not execute, the production release checklist.

## Task 8 — Full documentation and API review

Update:

- OpenAPI paths, schemas, headers, and examples;
- API README environment variables and local workflow;
- the frontend Security and report-validation user guidance;
- account-recovery support guidance;
- migration and rollback notes;
- known limitations, especially Google-provider reauthentication if still unsupported.

Make sure OpenAPI never includes a real secret, proof, recovery code, or production host credential.

## Task 9 — Final quality gates

Run:

- TypeScript application typecheck;
- test typecheck;
- unit suites;
- middleware suites;
- controller suites;
- integration suites;
- database repository contracts;
- production-style build;
- development Docker smoke test;
- OpenAPI retrieval;
- dependency and container security review available to the team.

Manually test narrow and desktop frontend layouts, keyboard navigation, screen reader labels, paste behavior, focus restoration, loading, errors, and recovery guidance.

## Production release gate

Before any future production deployment, a senior engineer must confirm:

- migrations were reviewed against production data size and locking risk;
- encrypted database and secret backups exist;
- production KMS/secret-store keys are configured;
- Redis is durable and shared across API instances;
- server clocks are synchronized;
- recovery support ownership is assigned;
- alerts and dashboards exist;
- the feature flags start in the intended state;
- rollback does not require dropping validation history;
- legal/product wording for report attestation is approved.

This checklist prepares production work; it does not perform it.

## Definition of done

- [ ] Security review has no unresolved high-severity issue.
- [ ] Key rotation is tested in development.
- [ ] Recovery runbooks exist and are exercised.
- [ ] Logs and metrics contain no secrets.
- [ ] Abuse, concurrency, and failure tests pass.
- [ ] Feature flags support staged enablement.
- [ ] Full automated and manual quality gates pass.
- [ ] A separate production release plan is ready for senior approval.
- [ ] No production environment was changed.

## Dev deploy

Phase 4 remains a development deployment. Use the stable local PostgreSQL and Redis instances to exercise operational behavior without recreating their volumes.

### 1. Preflight

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml ps
```

Confirm the complete migration history is applied and the Phase 1–3 smoke flow already works.

### 2. Update development feature flags and keys

Add development-only values to ignored `.env.dev`. Keep placeholders in `.env.dev.example`.

If testing key rotation, retain the old development key until every test factor has been re-encrypted or intentionally re-enrolled. Never overwrite the only copy of a key still needed by database rows.

### 3. Change Compose only when needed

Possible justified changes include health checks, API environment wiring, or a development-only observability service approved by the team. Do not duplicate PostgreSQL or Redis, and do not place credentials directly in YAML.

If Compose changes, review the exact service targets before applying them. Start only the services that changed.

### 4. Build and start a new API image

When dependencies, Dockerfile, or lockfile changed:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml build api
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm ci
docker compose --env-file .env.dev -f compose.dev.yaml up -d --no-deps api
```

For source-only changes:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml up -d --no-deps api
```

### 5. Apply a migration only if Phase 4 adds schema

Do not create an empty migration. If audit, idempotency, or key-rotation work genuinely changes Prisma:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npx prisma validate
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npx prisma migrate dev --name phase_4_mfa_hardening
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm run db:generate
```

Review the generated SQL before applying it.

### 6. Run final verification

```powershell
npm run lint
npm run lint:test
npm test
npm run build
docker compose --env-file .env.dev -f compose.dev.yaml logs --tail 200 api
```

Also run the guarded database test workflow documented in `api/test/TESTING.md` and exercise Redis outage, rate-limit, key-rotation, recovery-code, proof-replay, and concurrent-validation scenarios.

### 7. Preserve stable services

Do not run:

```text
docker compose down -v
npm run db:reset:dev
```

Those operations would destroy the stable local database or cache state and are not part of this rollout.

### Rollback

Turn off the development feature flags first. Revert the API application change and restart only the API service. Prefer forward database fixes for additive migrations. Restore a verified development backup only when data integrity is affected.

Previous: [Phase 3 — Step-up report validation](./phase-3-step-up-report-validation.md)
