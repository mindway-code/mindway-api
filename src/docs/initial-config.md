# Initial Config

## Goal
Provide the minimum steps to run and maintain the backend locally.

## Prerequisites
- Node.js LTS
- npm
- PostgreSQL database or Supabase Postgres
- Redis when required by the project

## Install
```bash
npm install
```

## Environment
Create `.env.dev` based on `.env.dev.example` and configure at least:
- `APP_ENV=dev`
- `PORT`
- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- cookie settings
- CORS origin settings

## Prisma
Generate client and apply migrations:
```bash
docker compose --env-file .env.dev -f compose.dev.yaml run --rm api npm run db:migrate:dev
```

## Run in development
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Start production build
```bash
npm start
```

## Notes
- Express app is created in `src/infra/http/app.ts`.
- HTTP server starts in `src/infra/http/server.ts`.
- API routes are mounted from versioned route files.
