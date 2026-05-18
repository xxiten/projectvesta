# ADR-0002: Backend — NestJS / TypeScript

Status: Accepted — 2026-05-18

## Context

The frontend is TypeScript. A solo/small team benefits from one language, one
talent pool and shared contracts. The strongest alternative was .NET/C#
(stronger financial/transactional ergonomics) — deferred unless the team becomes
.NET-strong.

## Decision

NestJS + TypeScript for the API. Its module system maps cleanly onto the
modular-monolith boundaries; shared types flow via workspace packages.

## Consequences

- End-to-end TypeScript; contracts shared via `@vesta/*` packages.
- Money handled via an integer `Money` value object (no floats) to mitigate the
  main risk vs. .NET decimal ergonomics.
- Revisit only if hard fiscal/performance guarantees dominate (see ADR-0008).
