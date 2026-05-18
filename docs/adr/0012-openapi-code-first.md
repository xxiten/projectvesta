# ADR-0012: Code-first OpenAPI (refines ADR-0005)

Status: Accepted — 2026-05-18

## Context

ADR-0005 set "REST + OpenAPI contract-first" with a hand-written
`packages/api-contracts/openapi.yaml`. In practice, hand-authoring the spec
ahead of a fast-moving NestJS surface (solo team) drifts from the controllers
and doubles the work.

## Decision

Generate the OpenAPI document **code-first** from NestJS controllers/DTOs via
`@nestjs/swagger`:

- Served at `/docs` (Swagger UI) and `/docs-json`.
- Exported to `packages/api-contracts/openapi.json` via
  `pnpm --filter @vesta/api openapi:export` (Nest _preview_ mode — no DB needed).
- Hand-authored shared TS types in `@vesta/api-contracts/src/index.ts` remain
  the single source of truth that **both** apps import directly (guarantees
  BE↔FE DTO consistency now); the generated JSON is for docs and future
  `openapi-typescript` client generation.

This **refines** ADR-0005: still REST + OpenAPI + a published contract, but the
contract is generated from code, not the other way around.

## Consequences

- Spec cannot drift from the implementation.
- `openapi.yaml` (hand-written stub) is superseded by `openapi.json` (generated).
- A future `openapi:generate-client` step can replace the hand types when the
  surface grows; call sites already import from `@vesta/api-contracts`.
