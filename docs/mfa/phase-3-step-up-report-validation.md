# Phase 3 — Step-up report validation

> Status: planned  
> Environment: development only  
> Audience: junior full-stack developer  
> Depends on: Phases 0, 1, and 2 completed

## Goal

Use the TOTP factor from Phase 1 to validate the exact submitted report revision created in Phase 2. Implement a reusable, short-lived, single-use step-up grant instead of putting TOTP logic inside the report module.

At the end of this phase, the report author can confirm a submitted revision with TOTP, and the API stores an auditable validation record.

## Safety rules

- MFA is additional authentication, not authorization. Always run report policy checks.
- Bind the proof to `revisionId`, not only `reportId`.
- Never send TOTP codes to report endpoints.
- Never persist the plaintext proof in PostgreSQL, logs, localStorage, or sessionStorage.
- Consume proofs atomically in Redis and fail closed when Redis is unavailable.
- A validated revision is immutable.
- Describe the result as application validation or attestation, not a legally qualified digital signature.

## Target flow

```text
1. User opens submitted revision
2. Frontend requests TOTP
3. POST /auth/mfa/step-up-grants
4. API verifies TOTP and returns opaque proof
5. POST /reports-children/:id/validations with X-MFA-Proof
6. API checks proof scope, authorization, revision, and hash
7. Prisma transaction creates validation and publishes revision
8. Proof cannot be reused
```

## Task 1 — Add validation and audit models

Add:

- `ReportValidation`;
- `ReportValidationType`;
- `MfaMethod`;
- a general `SecurityAuditEvent` if it was not introduced earlier.

For the first product workflow, support `AUTHOR_ATTESTATION`. Keep the enum ready for future guardian acknowledgement or reviewer approval, but do not expose unimplemented behaviors.

`ReportValidation` must include:

```text
revisionId
validatorId
totpFactorId
type
method
requestId
validatedAt
revokedAt
revokedById
revocationReason
```

Use a unique constraint that prevents duplicate author attestations for one revision. A revoked validation should normally require a new report revision rather than silently overwriting the old validation.

Audit events must not contain codes, secrets, proof tokens, or report content.

## Task 2 — Implement step-up grants in strict Redis storage

Add functions to `securityStore.ts` for:

- issuing a grant;
- loading grant metadata by a hash of the opaque token;
- atomically consuming a grant;
- identifying expired, already-used, or scope-mismatched grants.

Recommended metadata:

```ts
type StepUpGrant = {
  userId: string;
  action: StepUpAction;
  resourceType: "reportRevision" | "account" | "user";
  resourceId: string;
  method: "TOTP" | "RECOVERY_CODE";
  factorId: string | null;
  issuedAt: string;
  expiresAt: string;
};
```

Generate at least 256 bits of random token material. Return the plaintext token once and use its SHA-256 digest as the Redis key.

Use an action allowlist:

```ts
const STEP_UP_ACTIONS = [
  "report.validate",
  "report.validation.revoke",
  "mfa.disable",
  "mfa.recovery_codes.regenerate",
  "account.delete",
] as const;
```

Only implement routes for actions that are ready. An allowlisted value is not permission to perform the action.

## Task 3 — Add the grant endpoint

```http
POST /api/auth/mfa/step-up-grants
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "method": "TOTP",
  "code": "123456",
  "action": "report.validate",
  "resourceType": "reportRevision",
  "resourceId": "revision-uuid"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "grant": "opaque-token",
    "expiresIn": 300
  }
}
```

Service behavior:

1. Require a valid access token.
2. Validate the action and resource shape.
3. Apply the Redis-backed user and IP attempt limit.
4. Load and decrypt the user's active TOTP factor.
5. Verify the code and matched time step.
6. Atomically advance `lastUsedTimeStep`; reject reuse and concurrent duplicates.
7. Issue the Redis grant for five minutes.
8. Write a sanitized successful or failed security event.

Recovery codes may issue grants too, but the response and audit method must say `RECOVERY_CODE`.

## Task 4 — Implement `requireStepUp` middleware

Create `src/core/middlewares/requireStepUp.middleware.ts`.

It should accept configuration rather than contain report-specific code:

```ts
requireStepUp({
  action: "report.validate",
  resourceType: "reportRevision",
  getResourceId: req => req.body.revisionId,
});
```

The middleware must verify:

- `X-MFA-Proof` is present;
- the grant exists and is not expired;
- `grant.userId === req.user.id`;
- action, resource type, and resource ID match exactly;
- the grant can be consumed only once.

Attach only sanitized grant context to `req`, such as method and factor ID. Update Express request types instead of using `any`.

Add `X-MFA-Proof` to CORS allowed headers.

## Task 5 — Implement transactional report validation

Add:

```http
POST /api/reports-children/:id/validations
Authorization: Bearer <access-token>
X-MFA-Proof: <opaque-proof>
Idempotency-Key: <uuid>
```

```json
{
  "revisionId": "revision-uuid",
  "expectedContentHash": "sha256-value",
  "type": "AUTHOR_ATTESTATION"
}
```

Recommended middleware order:

1. route-specific security rate limiter;
2. `authMiddleware`;
3. parameter and body validation;
4. `requireStepUp`;
5. controller.

The service must execute one Prisma transaction:

1. Load the report and revision.
2. Confirm the revision belongs to the route report.
3. Confirm the revision is the current `SUBMITTED` revision.
4. Confirm the stored and expected content hashes match.
5. Confirm the authenticated user can perform author attestation.
6. Create `ReportValidation` with MFA method and factor ID.
7. Mark the previously published revision `SUPERSEDED`, when applicable.
8. Mark the target revision `VALIDATED`.
9. Update `publishedRevisionNumber`.
10. Clear the working revision state according to the Phase 2 model.
11. Create an audit event.

Use `Idempotency-Key` and the database unique constraint so an HTTP retry returns the existing success instead of creating a second validation.

If proof consumption succeeds but the database transaction fails, the user may need a new proof. Document this behavior. Do not restore a consumed grant unless a carefully designed idempotency implementation proves it is safe.

## Task 6 — Validation read model

Add validation summary to report responses:

```ts
type ReportValidationSummary = {
  id: string;
  type: "AUTHOR_ATTESTATION";
  method: "TOTP" | "RECOVERY_CODE";
  validatedAt: string;
  validator: {
    id: string;
    name: string | null;
  };
  revisionNumber: number;
};
```

Do not expose factor IDs, audit metadata, IP information, or internal request IDs in ordinary report responses.

## Task 7 — Angular validation experience

### Services

Add:

- `mfa.service.ts` for factor status and grant issuance;
- a typed validation method in `reports-child.service.ts`;
- MFA and report-validation interfaces.

Keep the proof in memory only and pass it directly on the validation request:

```ts
headers: { "X-MFA-Proof": proof }
```

Do not add the proof to the global interceptor.

### Report details

Add:

- validation status and revision number;
- validator and validation time;
- “Identity confirmed with two-step verification” copy;
- a Validate report action only when `capabilities.canValidate` is true;
- a warning when a newer draft exists while an older revision remains validated.

### Validation dialog

1. Show a final read-only preview and revision number.
2. Explain that validation freezes this exact revision.
3. Accept a six-digit code with `inputmode="numeric"` and paste support.
4. Prevent duplicate submissions.
5. Request a grant bound to `revisionId`.
6. Immediately call the validation endpoint.
7. Show success only after the transaction completes.
8. Restore focus when the dialog closes.

If MFA is not configured, link to Settings → Security with a return URL to the report.

### Interceptor correction

The auth interceptor must refresh only for `ACCESS_TOKEN_EXPIRED`. It must not refresh or retry for `MFA_CODE_INVALID`, proof errors, or report validation conflicts.

## Error codes

Add and document:

```text
MFA_PROOF_REQUIRED
MFA_PROOF_INVALID
MFA_PROOF_EXPIRED
MFA_PROOF_ALREADY_USED
MFA_PROOF_SCOPE_MISMATCH
REPORT_NOT_SUBMITTED
REPORT_REVISION_MISMATCH
REPORT_CONTENT_HASH_MISMATCH
REPORT_ALREADY_VALIDATED
REPORT_VALIDATOR_NOT_ALLOWED
```

## Required tests

- Proof belongs to the correct user, action, type, and revision.
- Proof for revision A cannot validate revision B.
- A proof cannot be replayed.
- Expired proof fails.
- Redis outage fails closed.
- A changed content hash fails validation.
- Only submitted revisions validate.
- Two concurrent validations produce one record.
- Idempotent retry returns the existing result.
- A newer validation supersedes the previous published revision correctly.
- Frontend does not persist proofs.
- Invalid TOTP does not trigger JWT refresh.
- Dialog keyboard, paste, loading, error, and focus behavior works.

## Definition of done

- [ ] TOTP verification issues a five-minute resource-scoped proof.
- [ ] The proof is one-time and fail-closed.
- [ ] Report validation targets an exact submitted revision and hash.
- [ ] Validation is transactional and auditable.
- [ ] Validated revisions are immutable.
- [ ] The frontend shows accurate validation information.
- [ ] Existing authorization still runs independently from MFA.
- [ ] OpenAPI and tests describe the complete flow.
- [ ] No production environment was changed.

## Dev deploy

This phase adds a database table, new Redis keys, a CORS header, and API/frontend code. It must use the existing development PostgreSQL and Redis volumes.

### 1. Preflight

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml ps
```

Confirm the Phase 1 factor tables and Phase 2 revision tables exist and their tests pass before applying Phase 3.

### 2. Apply the additive migration

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npx prisma validate
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npx prisma migrate dev --name phase_3_step_up_report_validation
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm run db:generate
```

The migration should add validation and audit structures without modifying existing revision content.

### 3. Update Compose only if required

The current Redis service already supports short-lived grants. Do not create a second Redis container.

Change `compose.dev.yaml` only if a new API environment variable or health dependency cannot be supplied through `.env.dev`. Validate Compose after editing it and keep credentials out of YAML.

### 4. Build a new API image when required

If only TypeScript source changed, the mounted watch directory is enough. If dependencies, the Dockerfile, or the lockfile changed:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml build api
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm ci
```

Start only the API:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml up -d --no-deps api
```

### 5. Validate

```powershell
npm run lint
npm run lint:test
npm test
npm run build
docker compose --env-file .env.dev -f compose.dev.yaml logs --tail 100 api
```

Run the full manual sequence with a development user:

1. enroll TOTP;
2. create and submit a report revision;
3. request a grant for that revision;
4. validate it;
5. replay the proof and confirm rejection;
6. create another revision and confirm the old proof cannot validate it.

### Rollback

The migration is additive. If application behavior fails, revert the Phase 3 code and keep validation tables unused while preparing a forward fix. Do not clear Redis globally; grant keys expire automatically. Do not remove PostgreSQL or Redis volumes.

Previous: [Phase 2 — Report revision workflow](./phase-2-report-revision-workflow.md)  
Next: [Phase 4 — Hardening and rollout](./phase-4-hardening-and-rollout.md)
