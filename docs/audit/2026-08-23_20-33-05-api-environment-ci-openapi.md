# AI Prompt Audit - 2026-08-23 20:33:05

## Prompt Summary

Create a safe API environment switch for development, test, and production; improve CI/CD with Docker; expose an OpenAPI/Insomnia setup; and document the requested work in an audit folder.

## Environment Switch

Implemented explicit environment selection through `APP_ENV` with support for:

- `development`: local PostgreSQL database
- `test`: isolated local test PostgreSQL database
- `production`: Supabase-oriented database configuration

Benefits:

- Reduces accidental writes to production or development data from tests.
- Makes deployment configuration auditable through validated environment names.
- Keeps host/platform secrets authoritative over local `.env` files.
- Enforces safer production cookie and CORS defaults.

## Docker And Local Databases

Added Docker stages and Compose services for API, Redis, development PostgreSQL, and test PostgreSQL.

Benefits:

- Developers can run the same dependency stack consistently.
- Tests can point at a separate `mindway_test` database.
- Production image no longer runs migrations implicitly at container startup.
- Docker targets map cleanly to dev, test, build, and production runtime concerns.

## CI/CD

Added a GitHub Actions workflow backed by `docker-compose.ci.yml`.

Benefits:

- Installs dependencies in Docker.
- Runs lint, tests, and build in a repeatable container environment.
- Changes behavior by environment/branch:
  - Pull requests only validate.
  - `develop` builds a development image.
  - `test` can deploy test migrations.
  - `main` runs production migrations against Supabase and pushes a production image.
- Leaves final deployment provider flexible through `DEPLOY_HOOK_URL`.

## OpenAPI And Insomnia

Added a modular TypeScript OpenAPI setup under `src/openapi`.

Benefits:

- Exposes `GET /api/openapi.json` for curl, tooling, and API clients.
- Exposes `GET /api/openapi/insomnia.json` for Insomnia import.
- Keeps OpenAPI paths divided by domain so files stay below 400 lines.
- Documents authentication headers and common response envelopes.

## Documentation

Updated README setup, Docker, CI/CD, base URL, and OpenAPI sections.

Benefits:

- Reduces onboarding ambiguity.
- Aligns docs with the actual `/api` mount point.
- Documents the new environment safety model beside the commands developers use.
