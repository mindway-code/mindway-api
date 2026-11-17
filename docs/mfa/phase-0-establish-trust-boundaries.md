# Phase 0 — Establish trust boundaries

> Status: planned  
> Environment: development only  
> Audience: junior full-stack developer  
> Depends on: the current stable API, PostgreSQL, and Redis containers

## Goal

Make the current authentication and report authorization trustworthy before adding MFA. TOTP cannot protect an action if a client can assign itself a non-public administrative role, if password reauthentication is missing, or if the API and frontend calculate different permissions.

At the end of this phase:

- public registration accepts only `common`, `enterprise`, `professional`, or `therapist`;
- public registration always rejects `admin` and unknown roles;
- changing a password verifies the current password;
- access-token failures have specific error codes;
- report permissions are decided by the API;
- report responses contain capabilities the frontend can display;
- no MFA or report-revision behavior exists yet.

## Safety rules

- Work only with `APP_ENV=dev` and `.env.dev`.
- Do not edit `.env.prod`, `compose.prod.yaml`, production secrets, or production data.
- Do not run `db:reset:dev`; the local database is stable and must be preserved.
- Do not recreate the PostgreSQL or Redis volumes.
- Keep the existing route → controller → service → repository structure.
- Add tests before changing the next trust boundary.

## Task 1 — Lock public registration to allowed public roles

### Problem

The Mindway interface intentionally supports four public registration paths:

| Interface choice | API role |
|---|---|
| Responsible for a child | `common` |
| School or clinic | `enterprise` |
| Health professional | `professional` |
| Therapist | `therapist` |

`admin` is not a public account type. It must never be possible to create an administrator by changing the registration request JSON.

The frontend selection is a user-experience decision, not a security boundary. A caller can bypass the Angular screens and call the API directly, so the API must independently allow the four public roles and reject every other value.

### Public registration policy

Define one shared backend type and runtime allowlist:

```ts
export const PUBLIC_REGISTRATION_ROLES = [
  "common",
  "enterprise",
  "professional",
  "therapist",
] as const;

export type PublicRegistrationRole =
  (typeof PUBLIC_REGISTRATION_ROLES)[number];
```

Do not include `admin`. Do not derive the allowed roles from the broader Prisma `UserRole` enum because that enum also contains privileged internal roles.

### Changes

1. In `src/api/v1/modules/auth/auth.types.ts`, keep `role` in `RegisterDTO`, but type it as `PublicRegistrationRole` rather than the complete `UserRole`.
2. In `src/api/v1/validators/auth.validator.ts`, define and export strict register and login schemas. The register schema must use an explicit enum containing only `common`, `enterprise`, `professional`, and `therapist`.
3. Make `role` required. Every registration screen already knows which account type it represents, and an explicit value avoids an ambiguous default.
4. Add `validate(...)` to `/auth/register` and `/auth/login` in `auth.routes.ts`.
5. In `registerService`, validate the role again at the service boundary before creating the user. Do not trust TypeScript types alone because API JSON is untrusted at runtime.
6. Reject `admin` and unknown roles with `400 BAD_REQUEST` or the project's validation-error response. Do not silently convert them to `common`, because silent conversion hides a malicious or broken client request.
7. Keep `provider` and `googleId` server-controlled. They must not be accepted from ordinary local-registration JSON.
8. In the Angular API interfaces, add the same `PublicRegistrationRole` type and use it for `RegisterDTO.role`. Keep `UserRole` for authenticated user records because those records may legitimately contain `admin`.
9. Confirm each registration component sends the intended mapping: responsible → `common`, school/clinic → `enterprise`, health professional → `professional`, therapist → `therapist`.
10. Preserve administrator creation only through an authenticated administrator route or a future controlled bootstrap process.
11. Update OpenAPI so the public register schema lists exactly the four public roles and does not advertise `admin`, `provider`, or `googleId` as client-controlled fields.

### Role selection versus role verification

Phase 0 permits users to select any of the four public account types because that matches the current product. This does not prove that a person is a licensed professional or represents a particular institution.

Therefore:

- child and report access must still depend on explicit associations and authorization rules, not only on the global role;
- selecting `professional`, `therapist`, or `enterprise` must not automatically grant access to unrelated children or reports;
- if the product later requires professional-license, school, clinic, CNPJ, invitation, or email-domain verification, model that as a separate verification status instead of overloading `User.role`;
- until such verification exists, UI text and API documentation must not claim that the role has been externally verified.

The clinic form currently sends `cnpj`, but the API registration model does not persist it. Do not pretend that this value verifies an enterprise account. Either reject unsupported profile fields in the strict registration schema or add a separately planned organization-profile model and verification workflow.

### Tests

- Registering with `common` creates a common user.
- Registering with `enterprise` creates an enterprise user.
- Registering with `professional` creates a professional user.
- Registering with `therapist` creates a therapist user.
- Omitting `role` is rejected as an incomplete registration request.
- Sending `role: "admin"` is rejected and creates no user.
- Sending an unknown or differently cased role is rejected and creates no user.
- Malformed email, missing password, and mismatched confirmation return a validation error.
- The authenticated administrator user-creation route can still assign any supported `UserRole`, including `admin`, according to its own authorization policy.

## Task 2 — Implement secure password change

### Problem

The Angular application calls `PATCH /users/me/password`, but that API route does not exist. MFA enrollment will also need a reliable way to prove that the current session owner knows the account password.

### Contract

```http
PATCH /api/users/me/password
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "currentPassword": "current password",
  "newPassword": "new password"
}
```

### Changes

1. Add a strict Zod schema with a reasonable minimum password length.
2. Add the route after `authMiddleware` and request validation.
3. Add `changeMyPasswordController` and `changeMyPasswordService`.
4. Load the authenticated user's password hash through a repository method that is used only for authentication operations.
5. Verify `currentPassword` with the existing password helper.
6. Hash `newPassword` with the existing password helper.
7. Update the password and revoke every active refresh token for that user in one Prisma transaction.
8. Return a generic authentication error when the current password is wrong. Do not reveal hashes or internal account details.
9. Document that Google-only accounts cannot use password reauthentication until provider reauthentication is implemented.

### Tests

- Correct current password changes the password.
- Incorrect current password changes nothing.
- Refresh tokens are revoked after a successful change.
- The old password no longer works and the new password does.
- A Google-only account receives a clear unsupported-reauthentication error.

## Task 3 — Distinguish access-token errors

Extend `ErrorCode` in `src/core/errors/httpError.ts` with explicit authentication codes, for example:

```ts
type AccessTokenErrorCode =
  | "ACCESS_TOKEN_MISSING"
  | "ACCESS_TOKEN_INVALID"
  | "ACCESS_TOKEN_EXPIRED";
```

Update JWT verification and `authMiddleware` so the response distinguishes an expired access token from other authentication failures without leaking token contents.

This is important because the frontend currently refreshes on every `401`. In a later phase, an invalid TOTP must not trigger access-token refresh.

Add middleware tests for missing, malformed, invalid, and expired tokens.

## Task 4 — Centralize report authorization

### Problem

The API and frontend currently disagree about who can manage a report. Security rules must exist only on the server.

### Changes

1. Create a focused report-policy helper or service, for example `reportsChildren.policy.ts`.
2. Keep it free from Express request/response objects.
3. Define named decisions instead of one broad `canManage` flag:

```ts
type ReportCapabilities = {
  canView: boolean;
  canEditDraft: boolean;
  canSubmit: boolean;
  canValidate: boolean;
  canCreateRevision: boolean;
  canArchive: boolean;
  canRevokeValidation: boolean;
};
```

4. For Phase 0, map existing report behavior into these capabilities without introducing revision states yet.
5. Return capabilities with every report read response.
6. Services must still enforce the policy. Capabilities are for the UI; they are not authorization tokens.
7. Remove role-based permission reconstruction from the frontend when the frontend is updated.

### Recommended initial policy

- The report author may edit their own report.
- A responsible user may view reports for their child but must not silently rewrite another person's authored content.
- An administrator may view and perform explicit administrative actions, but ordinary content edits should preserve authorship.
- Associated users can manage only their own reports unless a separate reviewer policy is introduced.

### Tests

Use table-driven unit tests covering administrator, author, responsible user, secondary responsible user, associated professional, and unrelated user.

## Task 5 — Update API documentation

Update:

- `src/openapi/modules/auth.paths.ts`;
- `src/openapi/modules/users.paths.ts`;
- report schemas in the relevant OpenAPI module;
- `src/openapi/components.ts` for new error codes and capability shapes.

## Definition of done

- [ ] Public registration accepts all four intended account types.
- [ ] Public registration rejects `admin` and unknown roles.
- [ ] Public role selection alone grants no unrelated child or report access.
- [ ] Auth route request bodies are validated.
- [ ] Password change verifies the old password and revokes sessions.
- [ ] Access-token error codes are distinguishable.
- [ ] Report capabilities come from the API.
- [ ] Service authorization does not trust frontend capabilities.
- [ ] Unit, middleware, controller, and integration tests pass.
- [ ] OpenAPI reflects the real behavior.
- [ ] No production configuration was changed.

## Dev deploy

All deployment work in this phase is for the development environment. PostgreSQL and Redis are already stable in Docker and must remain running with their existing volumes.

### 1. Check the stable services

From `api/`:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml ps
```

Confirm `postgres` and `redis` are healthy before changing the API container.

### 2. Validate locally

```powershell
npm run lint
npm run lint:test
npm test
npm run build
```

Phase 0 should not require a Prisma migration. If implementation reveals a real schema requirement, stop and document it before creating a migration.

### 3. Deploy source-only changes

The API source directory is mounted into the development container. In normal watch mode, TypeScript changes reload without rebuilding PostgreSQL, Redis, or the API image.

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml up -d --no-deps api
```

### 4. Build a new API image only when required

Rebuild if `Dockerfile`, `package.json`, or `package-lock.json` changed:

```powershell
docker compose --env-file .env.dev -f compose.dev.yaml build api
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm ci
docker compose --env-file .env.dev -f compose.dev.yaml up -d --no-deps api
```

`--no-deps` protects the stable PostgreSQL and Redis services from unnecessary recreation.

### 5. Smoke test

Verify:

- `GET /api/health`;
- each public role can register successfully;
- public registration cannot create an admin or unknown role;
- login still succeeds;
- password change works;
- the old refresh session is rejected;
- report responses include capabilities.

### Rollback

Revert the Phase 0 application commit and restart only the API service. Do not remove volumes and do not reset the database.

Next: [Phase 1 — MFA foundation](./phase-1-mfa-foundation.md)
