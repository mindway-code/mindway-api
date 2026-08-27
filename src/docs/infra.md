# Infra

## Purpose
`src/infra` contains technical implementations used by the application.

## Main folders
- `database/`
- `http/`
- `redis/`
- `realtime/`

## Database
### Prisma
- Prisma client lives in `src/infra/database/prisma/client.ts`.
- Schema and migrations live under `src/infra/database/prisma`.
- Repositories live in `src/infra/database/repositories`.

### Repository rules
- Repositories must contain DB access only.
- Return clean data needed by services.
- Avoid HTTP concerns and response formatting.
- Keep Prisma `select` and query logic here.

## HTTP
### `infra/http/app.ts`
- Creates Express app.
- Registers middleware, routes, and error handler.
- Should not contain business logic.

### `infra/http/server.ts`
- Starts and stops HTTP server.
- Initializes realtime socket.
- Handles graceful shutdown.

## Redis
### `infra/redis/redis.ts`
- Centralize Redis connection and helpers.
- Do not scatter Redis initialization across services.

## Realtime
### `infra/realtime/*`
- Socket authentication, rooms, and events live here.
- Keep realtime concerns separated from REST controllers.

## Good practices
- Infra should implement technology details, not business rules.
- Services may depend on infra, but infra should remain generic.
- Prefer small repository functions over giant multi-purpose ones.

## Avoid
- Controllers importing Prisma client directly.
- Realtime logic inside route/controller files.
- Config duplication across infra modules.
