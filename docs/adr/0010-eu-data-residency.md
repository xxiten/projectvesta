# ADR-0010: EU data residency

Status: Accepted — 2026-05-18

## Context

GDPR and Italian fiscal/registration obligations require guest and fiscal data
to stay within the EU.

## Decision

All managed-SaaS infrastructure (compute, database, object storage, backups)
runs in an EU region. No data-processing dependency may move PII outside the EU
without an explicit, documented decision (a new ADR).

## Consequences

- Vendor/region choices are constrained to EU options.
- Self-host keeps data on the customer's own EU premises by construction.
