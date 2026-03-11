# Mindway API

Node.js (Express) REST API for Mindway, built with TypeScript, Prisma (PostgreSQL), JWT auth (access token) + refresh tokens stored in an HTTP-only cookie, and a modular `v1` route structure.

## Quick Start

### 1) Requirements

- Node.js: **20.x** recommended (Docker image uses `node:20.19.4-slim`)
- Package manager: **npm** (repo includes `package-lock.json`)
- Database: **PostgreSQL** (required)
- Redis: optional (a client exists, but Redis is not wired into the HTTP layer)

### 2) Install

```bash
cd api
npm ci
```

### 3) Configure environment

This repository includes `api/.env.example`, but it is currently empty. Create your `api/.env` and set the variables listed in **Environment variables** below.

### 4) Database (Prisma)

```bash
cd api
npm run prisma:generate
npm run prisma:migrate
```

### 5) Run (dev)

```bash
cd api
npm run dev
```

Server listens on `PORT` (default: `3333`). Health check: `GET /health`.

---

## Overview

### What it does

- Authentication:
  - Register + login with email/password
  - Issues **access token** (JWT) in the JSON response
  - Issues **refresh token** (JWT) via **HTTP-only cookie**
  - Refresh-token rotation backed by a `refresh_tokens` table (hashed tokens, revocation)
- Core resources (currently wired in the app):
  - Users (admin list/create; self profile read/update/delete)
  - Families (admin list/create; update/delete routes exist but have a known routing mismatch — see Troubleshooting)
  - Tasks (create/list requires admin; update/delete require auth)
- Standard response envelopes for success + errors
- CORS + Helmet + HTTP request logging + rate limiting middleware (used broadly)

### Architecture highlights

- Express app bootstrap in `src/infra/http/app.ts`
- API routes grouped under `src/api/v1`
- Controllers call Services; Services call Prisma Repositories
- Environment validation using `zod` in `src/core/config/env.ts`

---

## Tech Stack

- Runtime: Node.js
- Language: TypeScript (ESM / `"type": "module"`)
- HTTP: Express
- Auth: JWT (`jsonwebtoken`) + refresh-token cookie (`cookie-parser`)
- DB: PostgreSQL
- ORM: Prisma
- Security: Helmet, CORS
- Rate limiting: `express-rate-limit`
- Logging: `pino` + `pino-http`
- Cache: Redis client (`redis`) present in `src/infra/redis/redis.ts` (not currently used by routes)

---

## Project Structure (key files)

```text
api/
  package.json
  tsconfig.json
  docker-compose.yml
  Dockerfile
  src/
    index.ts
    api/
      v1/
        v1.routes.ts
        modules/
          auth/
          users/
          families/
          tasks/
          appointments/
          familyMembers/
          socialNetworks/
          socialNetworkUsers/
    core/
      config/env.ts
      config/cors.ts
      errors/httpError.ts
      middlewares/auth.middleware.ts
      middlewares/authAdmin.middleware.ts
      middlewares/rateLimit.middleware.ts
      logger/logger.ts
    infra/
      http/app.ts
      http/server.ts
      database/
        prisma/schema.prisma
        prisma/migrations/
        repositories/
      redis/redis.ts
    utils/
      response.ts
      pagination.ts
      crypto/jwt.ts
      crypto/hash.ts
      tokens/refreshToken.ts
      tokens/cookie.ts
```

---

## Requirements

- Node.js: 20.x recommended
- PostgreSQL connection string for `DATABASE_URL`
- Optional: Redis URL for caching (if you wire `src/infra/redis/redis.ts` into your services)

---

## Setup & Run

### Install dependencies

```bash
cd api
npm ci
```

### Environment variables

Environment is validated at startup by `src/core/config/env.ts`. If validation fails, the process throws `Invalid environment variables`.

| Variable | Required | Description | Example |
|---|---:|---|---|
| `NODE_ENV` | no | `development` \| `test` \| `production` | `development` |
| `PORT` | no | HTTP server port | `3333` |
| `DATABASE_URL` | yes | Prisma Postgres connection string | `postgresql://user:pass@localhost:5432/mindway?schema=public` |
| `JWT_ACCESS_SECRET` | yes | Secret used to sign access tokens (min length enforced) | `replace-with-long-secret-string` |
| `JWT_REFRESH_SECRET` | yes | Secret used to sign refresh tokens (min length enforced) | `replace-with-long-secret-string` |
| `JWT_ACCESS_EXPIRES_IN` | no | Access token TTL (jsonwebtoken format) | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | no | Refresh token TTL (jsonwebtoken format) | `30d` |
| `COOKIE_NAME` | no | Cookie name used to store refresh token | `refresh_token` |
| `COOKIE_DOMAIN` | no | Cookie domain | `localhost` |
| `COOKIE_PATH` | no | Cookie path | `/` |
| `COOKIE_MAX_AGE_DAYS` | no | Refresh cookie max-age in days | `30` |
| `CORS_ORIGIN` | yes | Allowed origin(s); supports comma-separated list | `http://localhost:3000` |
| `AUTH_RATE_LIMIT_WINDOW_MS` | no | Rate limit window (ms) | `900000` |
| `AUTH_RATE_LIMIT_MAX` | no | Max requests per window | `20` |
| `GOOGLE_CLIENT_ID` | yes | Google OAuth client id (used by `src/utils/google.ts`) | `123.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | no | Google OAuth client secret (code exchange flow) | `...` |
| `GOOGLE_REDIRECT_URI` | no | Google OAuth redirect URI (code exchange flow) | `https://yourapp.com/oauth/callback` |
| `LOG_LEVEL` | no | Pino log level | `info` |

Additional variables referenced elsewhere:

- `DIRECT_URL`: referenced by Prisma schema (`schema.prisma`) as `directUrl = env("DIRECT_URL")` (**Not validated** in `env.ts`). If you use it, set it to a direct connection string (often used for migrations).
- `REDIS_URL`: used by the Redis client (`src/infra/redis/redis.ts`) (**Not validated** in `env.ts`).

### Prisma (generate/migrate/studio)

```bash
cd api
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

Notes:

- Prisma schema path is configured in `package.json` under `"prisma.schema"` to `src/infra/database/prisma/schema.prisma`.
- Migrations live under `src/infra/database/prisma/migrations/`.

### Run scripts

From `api/package.json`:

```bash
# watch mode
npm run dev

# compile TypeScript
npm run build

# run compiled output
npm start
```

Important: `npm start` is configured as `node dist/server.js`, but the TypeScript entrypoint is `src/index.ts`. Depending on your TypeScript output structure, you may need to adjust the start command to the compiled entry file (see Troubleshooting).

### Docker (optional)

`api/docker-compose.yml` runs two services:

- `redis` on `6379`
- `api` on `3333` (dev target)

```bash
cd api
docker compose up --build
```

Note: The `api/Dockerfile` currently contains a `COPY prisma ./prisma` step, but this repo’s Prisma schema lives under `src/infra/database/prisma/`. You may need to update the Dockerfile if builds fail (see Troubleshooting).

---

## API Conventions

### Base URL

There is no global `/api/v1` prefix in code. Routes are mounted at the root.

Default local base URL:

```text
http://localhost:3333
```

### Success envelope

All controllers return JSON using `sendSuccess()`:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "pagination": { "page": 1, "pageSize": 10, "total": 123, "totalPages": 13 }
  },
  "message": "Optional message"
}
```

Notes:

- `meta` is optional.
- Creation endpoints currently respond with `200 OK` (no explicit `201` in controllers).

### Error envelope

Errors returned by `sendError()`:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {}
  }
}
```

Common error codes (see `src/core/errors/httpError.ts`):

- `BAD_REQUEST`, `VALIDATION_ERROR`
- `UNAUTHORIZED`, `FORBIDDEN`
- `NOT_FOUND`, `CONFLICT`
- `TOO_MANY_REQUESTS`
- `INTERNAL_ERROR`

### Pagination

List endpoints accept:

- `page` (default: `1`)
- `pageSize` (default: `10`, max: `100`)

Response pagination is returned in `meta.pagination`:

```json
{
  "meta": {
    "pagination": { "page": 1, "pageSize": 10, "total": 0, "totalPages": 1 }
  }
}
```

### Authentication

This API uses:

- **Access token (JWT)**: sent via header `Authorization: Bearer <token>`
- **Refresh token (JWT)**: stored in an **HTTP-only cookie** (`COOKIE_NAME`, default `refresh_token`)

Access token payload includes:

- `sub`: user id
- `role`: user role (e.g. `admin`, `common`, `therapist`, ...)

#### Refresh flow

- `POST /auth/login` (or `/auth/register`) returns `accessToken` in JSON and sets refresh cookie.
- `POST /auth/refresh` reads refresh cookie, rotates it (revokes old DB row), returns new access token and sets a new refresh cookie.
- `POST /auth/logout` revokes the refresh token (best-effort) and clears the cookie.

Cookie security behavior (from `src/utils/tokens/cookie.ts`):

- `httpOnly: true`
- `secure: true` only when `NODE_ENV === "production"`
- `sameSite: "none"` in production, `"lax"` otherwise
- `domain`/`path` from env

### Rate limiting

`authRateLimiter` is applied to most routes in `v1` (including `/health`). Default configuration:

- window: `AUTH_RATE_LIMIT_WINDOW_MS` (default 15 minutes)
- max: `AUTH_RATE_LIMIT_MAX` (default 20)

On limit exceeded, the API responds with:

```json
{
  "success": false,
  "error": { "code": "TOO_MANY_REQUESTS", "message": "Too Many Requests" }
}
```

### CORS

CORS is enabled with:

- `origin`: from `CORS_ORIGIN` (supports comma-separated values)
- `credentials: true`
- allowed headers: `Content-Type`, `Authorization`

---

## API Reference (v1)

Routes below are extracted from `src/api/v1/**.routes.ts`.

### Health

#### GET `/health`

- Purpose: health check
- Auth: no
- Rate limited: yes
- Success response:

```json
{ "success": true, "data": {}, "message": "Server Ok" }
```

---

### Auth

#### POST `/auth/register`

- Purpose: create a user and start a session
- Auth: no
- Rate limited: yes
- Body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "strong-password",
  "role": "common",
  "provider": "local",
  "googleId": null
}
```

- Success response (sets refresh cookie):

```json
{ "success": true, "data": { "accessToken": "..." }, "message": "Registered" }
```

- Common errors: `400 BAD_REQUEST`, `429 TOO_MANY_REQUESTS`

#### POST `/auth/login`

- Purpose: login with email/password
- Auth: no
- Rate limited: yes
- Body:

```json
{ "email": "jane@example.com", "password": "strong-password" }
```

- Success response (sets refresh cookie):

```json
{ "success": true, "data": { "accessToken": "..." }, "message": "Logged in" }
```

- Common errors: `401 UNAUTHORIZED`, `429 TOO_MANY_REQUESTS`

#### POST `/auth/refresh`

- Purpose: rotate refresh token and get a new access token
- Auth: refresh cookie required
- Rate limited: yes
- Body: none
- Success response (sets new refresh cookie):

```json
{ "success": true, "data": { "accessToken": "..." }, "message": "Token refreshed" }
```

- Common errors: `401 UNAUTHORIZED` (also clears refresh cookie on failure)

#### POST `/auth/logout`

- Purpose: revoke refresh token and clear cookie
- Auth: refresh cookie recommended
- Rate limited: yes
- Body: none
- Success response (clears refresh cookie):

```json
{ "success": true, "data": {}, "message": "Logged out" }
```

#### GET `/auth`

- Purpose: route sanity check
- Auth: no
- Rate limited: yes
- Success response:

```json
{ "success": true, "data": {}, "message": "Auth Routes Ok" }
```

---

### Users

#### GET `/users`

- Purpose: list users (paginated)
- Auth: **yes** (access token)
- Role: **admin**
- Rate limited: yes
- Query params: `page`, `pageSize`
- Success response:

```json
{
  "success": true,
  "data": [],
  "meta": { "pagination": { "page": 1, "pageSize": 10, "total": 0, "totalPages": 1 } }
}
```

#### POST `/users`

- Purpose: create a user (admin)
- Auth: **yes**
- Role: **admin**
- Rate limited: yes
- Body (fields supported in service/repository):

```json
{
  "name": "New User",
  "email": "new@example.com",
  "password": "optional",
  "role": "common",
  "provider": "local",
  "googleId": "optional"
}
```

#### GET `/users/me`

- Purpose: get current user profile
- Auth: **yes**
- Rate limited: yes

#### PATCH `/users/me`

- Purpose: update current user profile
- Auth: **yes**
- Rate limited: yes
- Body (any subset):

```json
{ "name": "Updated", "email": "updated@example.com", "password": "new", "role": "common" }
```

#### DELETE `/users/me`

- Purpose: delete current user
- Auth: **yes**
- Rate limited: yes

Common errors for user endpoints:

- `401 UNAUTHORIZED` (missing/invalid access token)
- `403 FORBIDDEN` (admin-only routes)

---

### Families

#### GET `/families`

- Purpose: list families (paginated)
- Auth: **yes**
- Role: **admin**
- Rate limited: yes
- Query params: `page`, `pageSize`

#### POST `/families`

- Purpose: create a family
- Auth: **yes**
- Role: **admin**
- Rate limited: yes
- Body:

```json
{ "name": "Family Name" }
```

#### PUT `/families/me`

- Purpose: update a family (see note below)
- Auth: **yes**
- Rate limited: yes
- Body:

```json
{ "name": "New Family Name" }
```

Note: the controller/service expect a family id from `req.params.id`, but the route path does not include `:id`. As-is, this endpoint will likely return a `BAD_REQUEST` error about missing id.

#### DELETE `/families/me`

- Purpose: delete a family (see note below)
- Auth: **yes**
- Rate limited: yes

Note: same routing mismatch as `PUT /families/me` (no `:id` param in the path).

#### GET `/family`

- Purpose: route sanity check
- Auth: no
- Rate limited: yes
- Success response:

```json
{ "success": true, "data": {}, "message": "Family Routes Ok" }
```

---

### Tasks

#### GET `/tasks`

- Purpose: list tasks for current user (paginated, filtered by status)
- Auth: **yes**
- Role: **admin** (middleware)
- Rate limited: yes
- Query params: `page`, `pageSize`, `status` (`pending` \| `in_progress` \| `done` \| `canceled`)

#### GET `/tasks/therapist`

- Purpose: list tasks for current therapist (paginated, filtered by status)
- Auth: **yes**
- Role: **admin** (middleware)
- Rate limited: yes
- Query params: `page`, `pageSize`, `status`

#### POST `/tasks`

- Purpose: create a task
- Auth: **yes**
- Role: **admin** (middleware)
- Rate limited: yes
- Body:

```json
{
  "therapistId": "uuid",
  "userId": "uuid",
  "status": "pending",
  "title": "My task",
  "description": "optional",
  "feedback": "optional",
  "note": "optional"
}
```

#### PUT `/tasks/:id`

- Purpose: update a task
- Auth: **yes**
- Rate limited: yes
- Body:

```json
{ "status": "in_progress", "title": "optional", "description": "optional" }
```

#### DELETE `/tasks/:id`

- Purpose: delete a task
- Auth: **yes**
- Rate limited: yes

#### GET `/task`

- Purpose: route sanity check
- Auth: no
- Rate limited: yes
- Success response:

```json
{ "success": true, "data": {}, "message": "Task Routes Ok" }
```

---

## Routes Defined But Not Mounted (not reachable by default)

The following route files exist under `src/api/v1/modules/**`, but are **not** registered in `src/api/v1/v1.routes.ts`, so they are not reachable unless you mount their routers.

### Appointments (not mounted)

Defined in `src/api/v1/modules/appointments/appointment.routes.ts`:

- `GET /appointments` (admin + auth)
- `GET /appointments/therapist` (admin + auth)
- `POST /appointments` (admin + auth)
- `PUT /appointments/:id` (auth)
- `DELETE /appointments/:id` (auth)
- `GET /appointment` (sanity check)

### Family Members (not mounted)

Defined in `src/api/v1/modules/familyMembers/familyMember.routes.ts`:

- `GET /family-members` (admin + auth)
- `POST /family-members` (admin + auth)
- `GET /family-members/:id` (auth)
- `PUT /family-members/:id` (auth)
- `DELETE /family-members/:id` (auth)
- `GET /family-member` (sanity check)

### Social Networks (not mounted)

Defined in `src/api/v1/modules/socialNetworks/socialNetwork.routes.ts`:

- `GET /social-networks` (admin + auth)
- `POST /social-networks` (admin + auth)
- `PUT /social-networks/:id` (auth)
- `DELETE /social-networks/:id` (auth)
- `GET /social-network` (sanity check)

### Social Network Users (not mounted)

Defined in `src/api/v1/modules/socialNetworkUsers/socialNetworkUser.routes.ts`:

- `GET /social-network-users` (admin + auth)
- `POST /social-network-users` (admin + auth)
- `GET /social-network-users/:id` (auth)
- `PUT /social-network-users/:id` (auth)
- `DELETE /social-network-users/:id` (auth)
- `GET /social-network-user` (sanity check)

---

## Example Requests (cURL)

Assume base URL is `http://localhost:3333`.

### Health

```bash
curl -s http://localhost:3333/health | jq
```

### Register

```bash
curl -i -s -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"strong-password","role":"common","provider":"local"}'
```

Note: this returns `accessToken` in JSON and sets a refresh cookie via `Set-Cookie`.

### Login

```bash
curl -i -s -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"strong-password"}'
```

### Authenticated request (access token)

```bash
ACCESS_TOKEN="replace-me"
curl -s http://localhost:3333/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Refresh access token (using cookie jar)

```bash
# 1) Login and store cookies
curl -s -c cookies.txt -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"strong-password"}' > /dev/null

# 2) Refresh using the stored refresh cookie
curl -s -b cookies.txt -X POST http://localhost:3333/auth/refresh | jq
```

### Pagination example

```bash
curl -s "http://localhost:3333/users?page=1&pageSize=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Tasks (create + update + delete)

```bash
# create (requires admin middleware)
curl -s -X POST http://localhost:3333/tasks \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"therapistId":"uuid","userId":"uuid","title":"My task","status":"pending"}' | jq

# update
TASK_ID="uuid"
curl -s -X PUT http://localhost:3333/tasks/$TASK_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}' | jq

# delete
curl -s -X DELETE http://localhost:3333/tasks/$TASK_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

---

## Troubleshooting

### Startup fails with “Invalid environment variables”

- Ensure all required env vars are set (especially `DATABASE_URL`, JWT secrets, `CORS_ORIGIN`, and `GOOGLE_CLIENT_ID`).
- JWT secrets must be at least 20 characters (enforced by Zod).

### Database connection errors

- Verify your `DATABASE_URL` points to a running PostgreSQL instance.
- Ensure migrations are applied: `npm run prisma:migrate`.
- If you rely on `DIRECT_URL` (used by Prisma in `schema.prisma`), set it explicitly.

### `npm start` fails / can’t find `dist/server.js`

`package.json` currently sets:

```text
start = node dist/server.js
```

but the TypeScript entrypoint is `src/index.ts`. After compiling, the entry file may be emitted under `dist/src/index.js` depending on your `tsconfig.json`. If you see this, update the start command accordingly.

### Docker build fails at `COPY prisma ./prisma`

This repo does not include an `api/prisma/` directory; Prisma schema lives under `src/infra/database/prisma/`. Update the Dockerfile COPY steps or remove that layer.

### Family update/delete endpoints return “Family id is required”

`PUT /families/me` and `DELETE /families/me` are wired to controllers expecting `req.params.id`, but the route path does not include `:id`.

---

## Contributing (minimal)

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-change`
3. Make changes and add tests if applicable
4. Open a PR with a clear description

---

## License

Not found in codebase.
