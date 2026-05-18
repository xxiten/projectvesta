# ADR-0001: Modular monolith architecture

Status: Accepted — 2026-05-18

## Context

Greenfield PMS, solo/very small team, transactional core (inventory, booking)
that benefits strongly from in-process ACID. Microservices would add operational
and distributed-systems cost the team cannot absorb at this stage.

## Decision

Build a modular monolith: one deployable, internally split into modules with
enforced boundaries. Modules communicate via public surfaces (`index.ts` /
`*.public.ts`) or domain events — never deep imports. Boundaries are enforced in
CI by `.dependency-cruiser.cjs`.

## Consequences

- Single transaction across core invariants (no distributed sagas yet).
- Service extraction remains possible later: boundaries already exist.
- Discipline required: the dependency-cruiser gate is not optional.
