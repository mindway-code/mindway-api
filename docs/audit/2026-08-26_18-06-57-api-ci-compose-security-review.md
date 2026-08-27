# AI Prompt Audit - 2026-08-26 18:06:57

## Prompt Summary

Review API Compose and CI files, remove hardcoded variables that represent a security risk, check Prisma schema safeguards in CI, and improve README first-setup instructions.

## Compose Security Review

Updated `docker-compose.yml` and `docker-compose.ci.yml` so committed YAML no longer stores database passwords, JWT secrets, Gmail app passwords, or fixed full database URLs.

Benefits:

- Keeps secrets in ignored env files or ephemeral CI files.
- Prevents accidental leakage through git history and Docker build context.
- Uses required variable interpolation so missing values fail early.
- Keeps Compose service hosts explicit without committing credential values.

## CI Environment Handling

Changed GitHub Actions to generate `.env.ci` at runtime with random database and token secrets.

Benefits:

- Pull request CI does not need long-lived repository secrets for local test execution.
- Generated secrets are file-scoped and permission-restricted in the runner.
- `.dockerignore` excludes `.env.*` so generated env files are not copied into Docker images.

## Prisma Schema Protection

Added Prisma schema validation, migration/schema diff checking, migration deploy, and migration status checks into CI.

Benefits:

- Catches invalid `schema.prisma` before lint/test/build.
- Catches mismatch between committed migrations and the Prisma schema.
- Verifies migrations can apply cleanly to an isolated PostgreSQL database.
- Uses `SHADOW_DATABASE_URL` for safe migration diff checks.

## Prisma Client Generation In Containers

Updated the development API container and CI workflow to run `prisma generate` inside the container before code imports `@prisma/client`.

Benefits:

- Prevents `@prisma/client did not initialize yet` when `node_modules` is container-owned.
- Keeps generated Prisma artifacts aligned with the schema copied into the container.
- Makes local Docker development and CI behave like the production image build.

## README Setup Flow

Reworked the README first setup and Docker/CI sections with terminal commands.

Benefits:

- Gives a step-by-step first-run path for local developers.
- Shows when to copy `.env.development` and `.env.test`.
- Documents `docker compose --env-file` usage.
- Explains the security boundary between templates, ignored env files, and CI-generated env files.
