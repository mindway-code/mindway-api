# Modules

## Purpose
Modules in `src/api/v1/modules` and `src/api/v2/modules` organize business features by domain.

## Current modules
- appointments
- auth
- families
- familyMembers
- messages
- socialNetworks
- socialNetworkUsers
- tasks
- users

## Expected files per module
A module should usually contain:
- `*.controller.ts`
- `*.service.ts`
- `*.routes.ts`
- `*.types.ts`

## Responsibilities
### Controller
- Read params, query, body, and cookies.
- Call service functions.
- Return HTTP response.
- Avoid business rules and DB access.

### Service
- Apply validation that depends on business rules.
- Orchestrate repositories and utils.
- Handle auth-related flows and token logic when relevant.
- Throw typed/http errors.

### Routes
- Register endpoints.
- Attach middlewares.
- Keep route files small.

### Types
- Define DTOs, result types, and internal contracts.
- Keep shared shapes local to the module unless truly global.

## Versioning
- `v1` and `v2` can evolve separately.
- Do not mix imports between versions unless it is intentional and stable.
- Shared logic should move to `utils`, `core`, or `infra` when appropriate.

## Good practices
- Keep naming consistent with folder name.
- Keep business logic in service, not controller.
- Use repository functions from `src/infra/database/repositories`.
- Reuse validators from `src/api/*/validators`.

## Avoid
- Prisma calls directly in controllers.
- Large route files with mixed concerns.
- Duplicating auth/token logic in many modules.
