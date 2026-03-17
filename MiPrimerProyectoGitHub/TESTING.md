# Testing Guidelines

## Recommended structure

For Angular unit tests, keep spec files next to the source files they test.

Examples:
- `src/app/core/services/players.service.ts`
- `src/app/core/services/players.service.spec.ts`

This is the default Angular convention and makes maintenance easier because implementation and tests evolve together.

## When to use a dedicated testing folder

Use `src/testing/` only for shared test utilities, factories, and reusable mocks.
Do not move all unit tests there.

## Coverage and CI

- Run locally: `npm run test`
- Run coverage locally: `npm run test:coverage`
- CI workflow runs coverage automatically on push and pull request.

Current minimum thresholds are defined in `angular.json` to prevent regressions.
