# Codex Prompt Guide for `api`

Use this file as the default prompt context when working on `api`.
It is meant to keep backend changes aligned with the current architecture,
Prisma schema, auth flow, business rules, and response patterns.

---

## 1. Project Context

- Project: `api`
- Stack: Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, Jest
- Module system: ESM (`"type": "module"`)
- HTTP app entry: `src/infra/http/app.ts`
- API root mount: `/api`
- Route aggregator: `src/api/v1/v1.routes.ts`
- Prisma schema: `src/infra/database/prisma/schema.prisma`

Main backend conventions:

- Feature routes live under `src/api/v1/modules`
- Validation schemas live under `src/api/v1/validators`
- DB access lives under `src/infra/database/repositories`
- Shared HTTP responses live in `src/utils/response.ts`
- HTTP/domain errors use `src/core/errors/httpError.ts`
- Auth middleware sets `req.user`

Current module families include:

- auth
- users
- appointments
- families
- familyMembers
- tasks
- socialNetworks
- socialNetworkUsers
- messages
- children
- associationChildren
- anamnesis
- reportsChildren

---

## 2. Backend Architecture Rules

Follow the existing project structure unless the request explicitly asks for a different pattern.

### Routes

- Register routes in `src/api/v1/v1.routes.ts`
- Keep all app routes mounted under `/api`
- Follow current route style already used by the module you touch
- Apply middleware in the existing order pattern:
  - rate limiter
  - auth middleware when protected
  - role middleware when needed
  - validation middleware when needed
  - controller

### Controllers

- Controllers should stay thin
- Read params, query, body, and `req.user`
- Call service functions
- Return `sendSuccess(...)`
- Catch and pass through `sendError(...)`
- Do not place heavy business logic in controllers

### Services

- Services hold business rules
- Validate critical invariants even if validation already exists at route level
- Use repository functions for persistence access
- Throw project `HttpError` helpers instead of raw errors
- Keep service return shapes aligned with frontend needs

### Repositories

- Repositories should encapsulate Prisma queries
- Reuse select objects and typed return values where possible
- Keep query logic close to the relevant entity
- Avoid leaking raw Prisma behavior into services/controllers

### Validation

- Use Zod schemas under `src/api/v1/validators`
- Validate `body`, `params`, or `query` through the existing `validate(...)` middleware
- Do not trust frontend validation alone

---

## 3. Response and Error Rules

Preserve the current response contract.

### Success

- Use `sendSuccess(res, data, message?, meta?)`
- Standard success shape:
  - `success: true`
  - `data: T`
  - optional `message`
  - optional `meta.pagination`

### Errors

- Use `HttpError` helpers from `src/core/errors/httpError.ts`
- Preferred error codes:
  - `BAD_REQUEST`
  - `UNAUTHORIZED`
  - `FORBIDDEN`
  - `NOT_FOUND`
  - `CONFLICT`
  - `TOO_MANY_REQUESTS`
  - `INTERNAL_ERROR`
- Do not leak raw Prisma errors to clients
- Convert validation and conflict cases into user-friendly API messages

---

## 4. Authentication and Authorization Rules

- Protected routes must use `authMiddleware`
- Authenticated user identity must come from `req.user`
- Do not trust `userId` from request body when the user is authenticated
- Keep access token, refresh token, and session restore flows working
- Do not break current login, register, refresh, logout, or `/users/me` behavior
- If a route is role-restricted, use the existing role middleware pattern instead of custom ad hoc checks in the route file

---

## 5. Prisma and Schema Rules

- Inspect `schema.prisma` before changing models or relations
- Keep relation names consistent with current schema naming
- If a new relation requires a back-relation, add it safely and explicitly
- Prefer safe typed repository functions instead of inline Prisma usage in controllers
- Keep migration changes minimal and scoped
- Do not create schema drift intentionally

When schema changes are required:

- update `schema.prisma`
- add or update repositories/services/routes as needed
- generate a Prisma migration if environment access allows
- report clearly if migration could not be generated locally

---

## 6. Current Business Rules That Must Not Break

These rules are important across the current backend.

### Users and auth

- `/users/me` must continue representing the authenticated user
- Auth must continue deriving the user from the bearer token
- Do not introduce routes that let common users escalate role or manage unrelated users without explicit authorization rules

### Children

- Child creation and update flows must preserve responsible ownership rules
- Access code must remain unique per child
- Do not expose child access in ways that bypass intended restrictions

### Association child

- Child association by access code must derive `userId` from `req.user.id`
- Do not require `userId` from the client for this flow
- Invalid access code must return a friendly error
- Duplicate associations must not surface raw DB uniqueness errors
- Responsible and secondary responsible users should already have access without duplicate association creation
- `GET /children/me` must return accessible children:
  - responsible
  - secondary responsible
  - associated

### Anamnesis

- Do not break child-scoped anamnesis behavior
- Keep the current child/anamnesis relation consistent

### Reports child

- Reports child flows depend on accessible child relationships
- Do not weaken permission checks around creating, updating, listing, or deleting reports

---

## 7. Code Pattern Rules

- Match existing naming conventions in the touched module
- Keep files focused and avoid mixing architectural styles
- Reuse existing helper patterns before inventing new abstractions
- Avoid `any`
- Keep types close to the module they belong to
- Do not rewrite unrelated modules during a focused task

---

## 8. What Codex Should Inspect Before Coding

Before making changes, inspect the relevant backend files in this order when applicable:

1. `src/infra/http/app.ts`
2. `src/api/v1/v1.routes.ts`
3. target module route/controller/service/types files
4. matching validator files
5. matching repository files
6. `src/utils/response.ts`
7. `src/core/errors/httpError.ts`
8. `src/infra/database/prisma/schema.prisma`

If the request touches auth, also inspect:

- `src/core/middlewares/auth.middleware.ts`
- any role middleware involved

If the request touches Prisma, inspect:

- related models
- relation names
- existing repository usage

---

## 9. Safe Change Checklist

Before finishing, Codex should verify:

- route path is registered correctly
- HTTP method matches the intended contract
- auth middleware is present when required
- request validation exists where needed
- service logic enforces core business rules
- response shape uses `sendSuccess`
- errors use project error helpers
- no raw Prisma error leaks remain
- unrelated modules were not silently broken

If possible, run:

- `npm run build`
- `npm test`

If relevant, also consider:

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:controllers`
- `npm run test:middlewares`

If Prisma schema changed and environment supports it, also consider:

- `npm run prisma:generate`
- `npm run prisma:migrate`

If commands fail due to unrelated existing issues, report that clearly instead of hiding it.

---

## 10. Output Expectations for Codex

When delivering backend work in this project, Codex should:

- summarize the change clearly
- mention created and updated backend modules/files
- document final route paths
- describe request and response shapes when changed
- mention build, test, and migration results
- call out remaining TODOs or environment blockers

---

## 11. Request Section

Paste or write the task for Codex below this line.

### My request for Codex

Describe the backend task you want.

Useful details to include:

- route or module name
- expected request DTO
- expected response DTO
- business rule to preserve
- Prisma models involved
- files or folders to inspect first
- what must not be broken

### Request

```md
[Write your request here]
```
