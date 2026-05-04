# Test

## Purpose
The `test/` folder contains unit, integration, controller, middleware, helper, mock, and setup files.

## Current structure
- `test/controllers`
- `test/helpers`
- `test/integration`
- `test/middlewares`
- `test/mocks`
- `test/setup`
- `test/unit`

## Recommended strategy
### Unit tests
- Test services and utils in isolation.
- Mock repository, email, Redis, and token helpers when needed.
- Keep them fast and focused.

### Integration tests
- Test auth and route flows with Express app.
- Validate status codes, cookies, and response shapes.

### Middleware tests
- Verify auth, validation, and request handling behavior.

## Helpers and mocks
- Put reusable request/app builders in `test/helpers`.
- Put Prisma, Redis, and email mocks in `test/mocks`.
- Keep test setup centralized in `test/setup`.

## Good practices
- Name files as `*.spec.ts`.
- Test happy path and failure path.
- Prefer stable assertions over fragile snapshots.
- Mock only what is necessary.

## When changing code
- Update unit tests when service logic changes.
- Update integration tests when auth, routes, or responses change.
- Update middleware tests when permissions or validation rules change.
