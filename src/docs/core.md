# Core

## Purpose
`src/core` contains foundational application concerns shared by the whole backend.

## Main folders
- `config/`
- `errors/`
- `logger/`
- `middlewares/`

## Config
### `core/config/env.ts`
- Load and validate environment variables.
- Export a single typed `env` object.

### `core/config/cors.ts`
- Centralize allowed origins, headers, methods, and credentials.

### `core/config/cookies.ts`
- Centralize cookie names and security options.

## Errors
### `core/errors/httpError.ts`
- Define reusable HTTP/domain errors.
- Services should throw these helpers instead of raw ad-hoc objects when possible.

## Logger
### `core/logger/logger.ts`
- Centralize app logger and HTTP logger.
- Avoid `console.log` outside temporary debugging.

## Middlewares
### Current middlewares
- `auth.middleware.ts`
- `authAdmin.middleware.ts`
- `authTherapist.middleware.ts`
- `rateLimit.middleware.ts`
- `validate.middleware.ts`

## Middleware rules
- Keep middleware focused on one responsibility.
- Read auth/token data and attach typed user data to request.
- Reuse shared validators instead of inline validation in routes.

## Avoid
- Business logic in middleware.
- Repeated env parsing in many files.
- Direct response formatting scattered across modules.
