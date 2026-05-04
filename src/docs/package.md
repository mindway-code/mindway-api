# Package

## Goal
Guide the agent on dependency decisions for `package.json`.

## Dependency rules
- Prefer the smallest set of dependencies that solves the problem.
- Do not add libraries for features already covered by the current stack.
- Avoid overlapping libraries with the same purpose.

## Existing stack intent
- `express` for HTTP API
- `cors`, `helmet`, `cookie-parser` for HTTP/security concerns
- `prisma` and `@prisma/client` for database access
- auth/token/hash helpers through current utils
- `jest` for tests
- Redis/socket deps only where needed

## When adding a dependency
Only add one when:
- the feature is hard to implement safely in-house
- it fits the current architecture
- it reduces maintenance instead of increasing it

## When removing a dependency
Remove it when:
- it is unused
- it overlaps with an existing tool
- it adds abstraction with no clear gain
- native Node.js or current utilities already solve the problem

## Good practices
- Keep scripts clear and minimal.
- Keep dev dependencies separate from runtime dependencies.
- Prefer stable, widely used packages.
- Document any important package decision in README or docs.

## Avoid
- adding frameworks inside the current framework
- multiple validation libraries for the same layer without reason
- unnecessary dependency injection libraries
- large utility packages for one small helper
