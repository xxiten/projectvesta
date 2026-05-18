# ADR-0003: Multi-tenancy via shared schema + row-level security

Status: Accepted — 2026-05-18

## Context

SaaS (pooled) and self-host (single tenant) must run the same code. A forgotten
`WHERE tenant_id = …` must not leak cross-tenant data.

## Decision

Shared database, shared schema. Every tenant-scoped table has `tenant_id NOT
NULL`. PostgreSQL row-level security with `FORCE ROW LEVEL SECURITY` enforces
isolation against `current_setting('app.tenant_id')`. All tenant data access
goes through `withTenant()` which sets the GUC inside a transaction. Unset
tenant ⇒ zero rows (default deny).

## Consequences

- Defense in depth: isolation holds even with a buggy query.
- Self-host = exactly one tenant; identical path, no special-casing.
- Per-tenant DB/schema is possible later for enterprise residency needs.
- A CI integration test proves isolation (`test/rls-tenant-isolation.spec.ts`).
