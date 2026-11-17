# Phase 2 — Report revision workflow

> Status: planned  
> Environment: development only  
> Audience: junior full-stack developer  
> Depends on: Phases 0 and 1 completed

## Goal

Replace mutable report validation semantics with explicit report revisions. A submitted or validated revision must never change silently. Existing reports must remain visible and must be marked as legacy unvalidated content.

This phase builds the report lifecycle but does not validate reports with TOTP yet.

## Safety rules

- The local database contains stable development data. Do not reset it.
- Use an expand-and-contract migration; do not remove current report columns in this phase.
- Existing reports must never be labeled validated during backfill.
- Backfill scripts must be repeatable or able to detect already migrated rows.
- Report writes that touch the aggregate and revision must use Prisma transactions.
- Do not let the frontend determine report permissions or state transitions.

## Target lifecycle

```text
LEGACY_UNVALIDATED       Existing report imported during migration
DRAFT                    Editable working revision
SUBMITTED                Frozen and waiting for validation
VALIDATED                Frozen and published
REJECTED                 Frozen with a review reason
SUPERSEDED               Previously validated revision replaced by a newer one
```

A validated report may later receive a new draft revision. The prior validated revision remains published until the new revision is validated.

## Task 1 — Add report revision models

Update `schema.prisma` with:

- `ReportRevisionStatus`;
- `ReportRevision`;
- report aggregate fields such as `currentRevisionNumber` and `publishedRevisionNumber`;
- relations from `ReportsChild` and `User`.

Recommended revision fields:

```text
id
reportId
revisionNumber
createdById
status
title
behavior
difficulty
recommendation
contentHash
submittedAt
rejectedAt
rejectionReason
createdAt
updatedAt
```

Add a unique constraint on `(reportId, revisionNumber)` and indexes for `(reportId, status)` and `createdById`.

For the first expand migration, `contentHash` may need to be nullable while existing data is backfilled. Make it required only after verification in a second migration.

Do not delete `title`, `behavior`, `difficulty`, or `recommendation` from `ReportsChild` yet. Old and new application versions may overlap during development.

## Task 2 — Implement canonical content hashing

Create `src/utils/crypto/contentHash.ts`.

The input must normalize fields in a fixed order:

```ts
{
  title,
  behavior: behavior ?? null,
  difficulty: difficulty ?? null,
  recommendation: recommendation ?? null,
}
```

Use a deterministic canonical JSON representation and SHA-256. Do not include timestamps, IDs, author display names, or database ordering in the content hash.

Add tests proving:

- identical normalized content has the same hash;
- changing any content field changes the hash;
- `undefined`, missing optional values, and `null` follow the documented normalization rule;
- object property order does not change the result.

The hash is an integrity value, not a digital signature.

## Task 3 — Backfill existing reports safely

Use two migration steps:

### Expand migration

1. Add new tables and nullable aggregate fields.
2. Do not drop or rewrite existing report content.

### Versioned backfill

Create a repository-aware script that:

1. reads existing `ReportsChild` rows in batches;
2. skips reports that already have revision 1;
3. creates revision 1 with status `LEGACY_UNVALIDATED`;
4. copies the exact current content;
5. calculates the canonical content hash;
6. sets `currentRevisionNumber = 1`;
7. leaves `publishedRevisionNumber` null unless product requirements explicitly define legacy visibility separately;
8. reports counts without logging report content.

Verify:

- total reports equals reports with at least one revision;
- no report has duplicate revision numbers;
- every migrated revision has a content hash;
- existing API-visible report text is unchanged.

### Contract migration

After verification, make required new fields non-null. Do not remove the old content columns until a later release after all reads and writes use revisions.

## Task 4 — Add revision repositories

Create focused repository functions for:

- loading a report aggregate with its current and published revision;
- creating a report plus revision 1;
- updating a draft revision;
- freezing a draft as submitted;
- creating the next draft revision from a published revision;
- marking a revision rejected;
- listing revision history;
- archiving the report aggregate.

Avoid a generic repository that exposes unrestricted Prisma updates. Each function should support a valid domain transition.

## Task 5 — Implement workflow services

Add a focused `reportWorkflow.service.ts` or equivalent. Keep Express details in controllers.

### Create report

In one transaction:

1. create `ReportsChild` with the authenticated author;
2. create revision 1 as `DRAFT`;
3. set the aggregate current revision;
4. return the report view model and capabilities.

### Edit draft

- Only the current draft can be edited.
- Recalculate `contentHash` after each saved change.
- A submitted, validated, rejected, or superseded revision cannot be patched.
- Validate authorization on the server.

### Submit

```http
POST /api/reports-children/:id/submissions
```

- Author-only for the recommended initial policy.
- Require a non-empty title and any other product-required fields.
- Recalculate the content hash inside the transition.
- Atomically change `DRAFT` to `SUBMITTED` and set `submittedAt`.
- Reject concurrent or repeated transitions with `409 CONFLICT`.

### Create next revision

```http
POST /api/reports-children/:id/revisions
```

- Use the last published revision as the starting content.
- Increment the revision number atomically.
- Create a new `DRAFT`.
- Keep the existing published revision unchanged.

### Archive

Change the existing delete behavior for reports with history. Set `archivedAt` and `archivedById` rather than deleting revisions.

## Task 6 — Define read models

Do not expose raw Prisma models directly. Return a report response shaped for the UI:

```ts
type ReportView = {
  id: string;
  childId: string;
  author: { id: string; name: string | null; email: string | null };
  lifecycle: {
    status: ReportDisplayStatus;
    currentRevisionNumber: number;
    publishedRevisionNumber: number | null;
    hasUnpublishedChanges: boolean;
  };
  revision: ReportRevisionView;
  validation: null;
  capabilities: ReportCapabilities;
};
```

For authorized authors, the display revision may be the current draft. For ordinary viewers, use the published revision when one exists. Explicitly test this visibility policy.

## Task 7 — Update API contracts

Add or update:

```http
GET   /api/reports-children/child/:childId
POST  /api/reports-children/child/:childId
GET   /api/reports-children/:id
GET   /api/reports-children/:id/revisions
PATCH /api/reports-children/:id/draft
POST  /api/reports-children/:id/submissions
POST  /api/reports-children/:id/rejections
POST  /api/reports-children/:id/revisions
DELETE /api/reports-children/:id
```

Keep compatibility aliases only where necessary and document their deprecation.

Add errors such as:

```text
REPORT_NOT_EDITABLE
REPORT_NOT_DRAFT
REPORT_ALREADY_SUBMITTED
REPORT_REVISION_CONFLICT
REPORT_ARCHIVED
```

## Task 8 — Update the Angular report feature

Update the report interfaces and service before changing presentation.

The frontend must:

- consume API capabilities instead of calculating `canManage`;
- display Draft, Awaiting validation, Legacy unvalidated, Rejected, and Changes pending labels;
- show revision number in report details;
- expose submit only when `canSubmit` is true;
- disable editing after submission;
- let an authorized author create a new revision after publication;
- never claim a report is validated in Phase 2.

Reuse existing Mindway tokens and report components. Do not introduce a new design system.

## Required tests

- Backfill preserves every current report.
- Existing reports become `LEGACY_UNVALIDATED`.
- New reports start at revision 1 draft.
- Only drafts are editable.
- Submit freezes content.
- Concurrent submit or revision creation is safe.
- A new draft does not replace the published revision.
- Archive preserves revisions.
- Read models honor viewer capabilities.
- Frontend status labels and buttons follow API capabilities.

## Definition of done

- [ ] Existing reports are preserved and marked legacy unvalidated.
- [ ] New report content is stored in revisions.
- [ ] Submitted revisions cannot be edited.
- [ ] Published and working revisions can coexist.
- [ ] The API returns lifecycle and capability data.
- [ ] The frontend no longer recreates authorization rules.
- [ ] Backfill counts and hashes are verified.
- [ ] No TOTP validation endpoint exists yet.
- [ ] No production environment was changed.

## Dev deploy

This is the highest-risk development migration because it transforms existing report data. Preserve the stable PostgreSQL and Redis volumes.

### 1. Preflight and backup

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml ps
```

Confirm services are healthy. Take a development PostgreSQL backup using the team's normal backup procedure. Record the report count before migration.

Do not proceed if the backup cannot be restored or the current report count is unknown.

### 2. Apply the expand migration

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npx prisma validate
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npx prisma migrate dev --name phase_2_report_revisions_expand
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm run db:generate
```

Review the SQL before accepting it. It must not drop existing report columns or data.

### 3. Run and verify the backfill

Run the committed backfill script inside the API container. Use the script name added by the implementation, for example:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm run db:backfill:report-revisions
```

Run its verification or dry-run mode afterward. The script must be safe to rerun.

### 4. Apply the contract migration

Only after backfill verification:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npx prisma migrate dev --name phase_2_report_revisions_contract
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm run db:generate
```

### 5. Build a new API image if dependencies or image files changed

Source-only changes use the mounted watch directory. If `package.json`, `package-lock.json`, or `Dockerfile` changed:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml build api
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm ci
```

Start only the API:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml up -d --no-deps api
```

### 6. Validate

```powershell
npm run lint
npm run lint:test
npm test
npm run build
docker compose --env-file .env.dev -f compose.dev.yaml logs --tail 100 api
```

Manually confirm that an old report still renders, a new draft can be edited, submission freezes it, and no report is incorrectly shown as validated.

### Rollback

Stop the API first. Prefer restoring the development backup if the backfill corrupted data. If only application code fails, revert the code and keep the additive schema until a safe forward fix is ready. Never use `db:reset:dev` as rollback.

Previous: [Phase 1 — MFA foundation](./phase-1-mfa-foundation.md)  
Next: [Phase 3 — Step-up report validation](./phase-3-step-up-report-validation.md)
