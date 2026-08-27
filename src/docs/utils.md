# Utils

## Purpose
`src/utils` contains generic helpers reused by many modules.

## Current areas
- `crypto/`
- `tokens/`
- `email/`
- `pagination.ts`
- `response.ts`
- `google.ts`

## Rules
- Put code here only if it is reusable across modules.
- Avoid putting module-specific business logic in utils.
- Keep helpers deterministic and easy to test.

## Crypto
### `utils/crypto/hash.ts`
- Hash passwords or sensitive values.
- Verify hashes.
- Do not place user-specific business rules here.

### `utils/crypto/jwt.ts`
- Sign and verify access tokens.
- Keep token payload typing clear.

## Tokens
### `utils/tokens/refreshToken.ts`
- Sign and verify refresh tokens.
- Reuse existing token contracts.

### `utils/tokens/cookie.ts`
- Set and clear auth cookies.
- Read config from `core/config/cookies.ts`.

## Response
### `utils/response.ts`
- Centralize response and error handling.
- Keep controllers thin by reusing shared helpers.

## Pagination
### `utils/pagination.ts`
- Normalize page, limit, skip, take, and meta.
- Always coerce query params to numbers before DB usage.

## Email
### `utils/email/*`
- Keep templates and client config isolated.
- Reuse mockable clients in tests.

## Avoid
- Duplicating token helpers in services.
- Mixing DB code with utility functions.
- Adding helpers used only once unless they improve clarity.
