# Backend test foundation (Jest + TS + TDD)

## Test levels (this repo)

- **Unit** (`test/unit/`): services, utils, small pure modules. Mock repositories + external IO.
- **Middlewares** (`test/middlewares/`): Express middleware behavior with mocked req/res/next.
- **Controllers** (`test/controllers/`): HTTP handlers in isolation, mocking services + cookie helpers.
- **Integration** (`test/integration/`): exercise `createApp()` + routes with `supertest`, while mocking DB/Redis/email/rate-limit as needed.
- **Database integration** (`test/database/`): exercise Prisma repositories and constraints against an isolated PostgreSQL `*_test` database.

## Naming conventions

- Use `*.spec.ts`
- Folder names mirror `src/` domains where possible (e.g. `test/unit/auth/...`).

## Mocking strategy (least invasive)

- Prefer mocking at the boundary modules you already have:
  - Repositories (`src/infra/database/repositories/*`) for Prisma access
  - Redis wrapper (`src/infra/redis/redis.ts`)
  - Token helpers (`src/utils/crypto/jwt.ts`, `src/utils/tokens/*`)
  - Email client (`src/utils/email/email.client.ts`)
- Avoid importing `src/index.ts` in tests (it starts server + connects Prisma).
- Tests mock the Redis boundary or skip cache access when `NODE_ENV=test`, so unit tests stay isolated from the dev Redis service.

## Env validation gotcha

Jest uses `APP_ENV=dev` with `NODE_ENV=test`. The setup file supplies safe values before application modules import the Zod-validated config; this is process isolation, not a third application environment.

### ESM note

This project is ESM (`"type": "module"` + TS `NodeNext`). For reliable mocking, tests use:

- `jest.unstable_mockModule(...)`
- dynamic `await import(...)` after mocks are registered

## Reusable mocks

- `test/mocks/prisma.ts`: Prisma client shape for repository tests (extend per model as needed)
- `test/mocks/redis.ts`: Redis wrapper mock for services using cache helpers
- `test/mocks/email.ts`: Email client mock for flows that send mail

## TDD workflow (example: auth register)

1. **Red**: write a failing spec for `registerService` (e.g. rejects when email already exists).
2. **Green**: implement minimal logic to satisfy the spec.
3. **Refactor**: extract small helpers (e.g. normalize email) only after behavior is covered.

## Commands

- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:database` (requires a migrated local `*_test` PostgreSQL database)
- `npm run test:middlewares`
- `npm run test:controllers`

## Local database integration

The database suite refuses non-local hosts and database names that do not end in `_test`.

```powershell
docker compose -f compose.test.yaml up -d --wait
$env:DATABASE_URL = "postgresql://user:pass@localhost:55432/mindway_test?schema=public"
$env:DIRECT_URL = $env:DATABASE_URL
npm run db:migrate:test
npm run test:database
docker compose -f compose.test.yaml down
```
