# Agent Guide

## Goal
This backend uses a simple modular architecture with clear separation between API, core, infra, utils, and tests.

## How the agent should act
- Prefer simple solutions over abstractions that add little value.
- Keep the flow: route -> controller -> service -> repository.
- Preserve existing naming and folder conventions.
- Avoid changing business rules unless explicitly requested.
- Keep files focused and not too long.
- Reuse utils and core helpers before creating new code.
- Respect API version folders (`v1`, `v2`).

## Coding rules
- Use TypeScript with explicit return types on exported functions.
- Use ESM import style with `.js` in local imports.
- Prefer named exports for reusable functions.
- Use async/await consistently.
- Validate input close to the API layer.
- Throw domain/http errors instead of returning ad-hoc error objects.

## Architecture rules
- Controllers handle `req`, `res`, status code, and response shape.
- Services contain business logic and orchestration.
- Repositories contain Prisma/database access only.
- Middlewares handle auth, validation, rate limit, and cross-cutting concerns.
- Utils contain generic helpers that are not tied to one module.
- Infra contains technical implementations like HTTP server, DB, Redis, and realtime.

## Response rules
- Prefer the shared response/error helpers already in the project.
- Keep response contracts consistent across modules.
- Do not leak internal stack traces to clients.

## Auth rules
- Access tokens and refresh tokens must use the existing helpers.
- Cookie settings must come from core config.
- Role checks must stay in middleware when possible.

## Change rules
- Avoid introducing dependency injection factories unless requested.
- Avoid creating new layers when controller/service/repository is enough.
- Prefer extending the current module instead of inventing parallel structures.

## Testing rules
- Add or update tests when changing service logic, middlewares, or controllers.
- Prefer unit tests for services and integration tests for auth flows.

## Output style
- Keep code clean, readable, and maintainable.
- Keep comments minimal and useful.
- Do not generate large boilerplate if the project already has a pattern.
