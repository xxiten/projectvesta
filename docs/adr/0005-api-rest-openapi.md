# ADR-0005: API — REST + OpenAPI contract-first

Status: Accepted — 2026-05-18 · **Refined by [ADR-0012](0012-openapi-code-first.md)
(2026-05-18): the OpenAPI document is now generated code-first from NestJS,
not hand-written. REST + published-contract intent is unchanged.**

## Context

Integration partners and a single-team frontend favour a simple, well-tooled
contract. GraphQL adds aggregation power but also schema/ops surface.

## Decision

REST described by an OpenAPI document in `@vesta/api-contracts`. The frontend
client is generated from it. Webhooks (inbound/outbound) for integrations. An
internal event bus for async. GraphQL deferred until a real aggregation pain
emerges.

## Consequences

- One source of truth for the API surface; typed FE client.
- Versioning at the REST boundary; integration adapters isolate provider quirks.
