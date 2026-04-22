# Backend test foundation (Jest + TS + TDD)

## Test levels (this repo)

- **Unit** (`test/unit/`): services, utils, small pure modules. Mock repositories + external IO.
- **Middlewares** (`test/middlewares/`): Express middleware behavior with mocked req/res/next.
- **Controllers** (`test/controllers/`): HTTP handlers in isolation, mocking services + cookie helpers.
- **Integration** (`test/integration/`): exercise `createApp()` + routes with `supertest`, while mocking DB/Redis/email/rate-limit as needed.

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
- `src/infra/redis/redis.ts` used to auto-connect at import time; it is now guarded with `NODE_ENV !== "test"` so unit tests stay isolated.

## Env validation gotcha

Current `src/core/config/env.ts` uses `z.string().url().optional().default("")` and `z.string().email().optional().default("")`, which makes those variables effectively required. The Jest `setupFiles` sets safe defaults so tests can import modules that depend on `env`.

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
- `npm run test:middlewares`
- `npm run test:controllers`
