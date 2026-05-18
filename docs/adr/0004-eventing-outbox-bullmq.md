# ADR-0004: Eventing — transactional outbox + BullMQ

Status: Accepted — 2026-05-18

## Context

Integration-relevant events must not be lost if a process dies after committing
a domain change but before notifying an external system. A full broker
(Kafka/RabbitMQ) is operational overhead the team should not take on yet.

## Decision

In-process domain events for synchronous subscribers. Integration-relevant
events are written to a transactional outbox table **in the same DB transaction**
as the domain change. A worker (BullMQ on Redis) relays them with idempotency,
retry/backoff and a dead-letter path.

## Consequences

- At-least-once delivery; consumers must be idempotent.
- No external broker to operate in the MVP.
- Move to a dedicated broker only when volume/topology demands it.
