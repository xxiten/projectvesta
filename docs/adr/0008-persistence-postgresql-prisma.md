# ADR-0008: Persistence — PostgreSQL + Prisma

Status: Accepted — 2026-05-18

## Context

Strong transactions, RLS, JSONB for external payloads and mature operations are
required. ORM ergonomics matter for a small team, but the availability hot path
needs precise SQL and locking.

## Decision

PostgreSQL 16. Prisma for standard CRUD and migrations. Raw SQL / `kysely` for
the availability/concurrency hot path. Migrations are versioned and idempotent
so self-host installs can upgrade safely (RLS lives in migrations).

## Consequences

- Type-safe data access with an escape hatch for performance-critical queries.
- Money stored as integer minor units; no floating point in money math.
