# Dev/Prod Environment Simplification Audit

## Request

Reduce the API environment model to two intentional runtime environments: `dev` and `prod`. Remove the unused test/CI infrastructure, keep Prisma commands predictable, validate runtime safety in the backend config layer, and keep production data protected from development operations.

This audit supersedes the environment and CI topology described in the earlier setup audits; those files remain as a historical record.

## Environment Model

- `APP_ENV=dev` owns local development, automated tests, and staging-like feature validation.
- `APP_ENV=prod` owns only production runtime behavior.
- `NODE_ENV=test` is retained as a Jest process flag, not as a third application environment.
- Zod rejects `APP_ENV=prod` unless `NODE_ENV=production`, local database URLs, insecure cookie settings, wildcard CORS, or a non-Supabase runtime database are supplied.

### Benefits

- Developers choose between two clear configurations instead of coordinating development, test, and CI variants.
- Test isolation remains available without creating unused infrastructure.
- Production cannot silently inherit development behavior.

## Compose and Secrets

- Replaced the previous Compose files with `compose.dev.yaml` and `compose.prod.yaml`.
- Removed the test PostgreSQL service and the CI Compose stack.
- Compose files contain variable references, not application credentials.
- Added Redis authentication to the local stack and kept runtime env files outside Docker build contexts.
- Preserved the existing local PostgreSQL and Redis volume names during the Compose transition.
- Renamed the local ignored configuration to `.env.dev`; production uses an ignored `.env.prod` created from `.env.prod.example`.

### Benefits

- Each Compose command has one obvious env file.
- Production connects only to managed PostgreSQL and Redis services.
- Real production secrets remain outside source control and image layers.

## Prisma Lifecycle

- `db:generate`: generate Prisma Client.
- `db:migrate:dev`: create/apply development migrations, then regenerate the client.
- `db:migrate:prod`: deploy committed migrations, then regenerate the client.
- `db:reset:dev`: reset local development data, then regenerate the client.

### Benefits

- Schema changes and client generation stay synchronized.
- Production has no command that creates migrations or resets data.
- Custom environment and migration verification scripts are no longer required.

## CI/CD

- CI uses the Docker `test` target to install dependencies, generate Prisma Client, lint, test, and build.
- No CI database or CI Compose file is created before integration tests need one.
- Only a successful push to `main` builds and pushes the production image.
- Production migration execution uses `db:migrate:prod` with Supabase URLs supplied by GitHub secrets.

### Benefits

- CI exercises the same Docker build definition used by the project with less orchestration.
- Deployment remains gated by all checks and committed migrations.
- A future integration-test environment can be added deliberately with clear ownership.
