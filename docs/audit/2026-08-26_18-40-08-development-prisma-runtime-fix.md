# AI Prompt Audit - 2026-08-26 18:40:08

## Prompt Summary

Diagnose a development container registration failure returning HTTP 500 and make the local Docker setup reliable.

## Root Cause

The API connected to PostgreSQL, but the development database had no application tables. Prisma raised `P2021` because `public.users` did not exist.

The migration could not apply because `src/infra/database/prisma/migrations/0_init/migration.sql` was encoded as UTF-16 LE, which sent embedded null bytes to PostgreSQL. After conversion to UTF-8, PostgreSQL also rejected the UTF-8 BOM, so the migration was rewritten as UTF-8 without BOM.

## Fixes

- Regenerated `0_init/migration.sql` from the current Prisma schema.
- Rewrote the migration as UTF-8 without BOM.
- Updated the development Docker command to run `prisma:generate` and `prisma:deploy` before `npm run dev`.
- Added a response test for invalid JSON body parser errors.
- Updated `sendError` so malformed JSON returns the standard `BAD_REQUEST` envelope.

## Benefits

- Fresh development containers initialize the Prisma client before imports.
- Fresh development databases receive committed migrations automatically.
- `register` works after migrations create `public.users`.
- Invalid JSON request bodies now return a consistent API response shape.
