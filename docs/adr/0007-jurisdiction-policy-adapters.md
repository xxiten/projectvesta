# ADR-0007: Jurisdiction profiles & policy adapters

Status: Accepted — 2026-05-18

## Context

South Tyrol / Italy imposes Fattura Elettronica (SDI), Alloggiati Web, ASTAT
statistics and the provincial Aufenthaltsabgabe. These must be served fully now
without hard-coding Italy into the core or blocking other markets.

## Decision

The core defines ports (`FiscalizationPort`, `GuestRegistrationPort`,
`TaxPolicy`, `LevyPolicy`). A per-tenant/property jurisdiction profile (e.g.
`IT-BZ`) selects an adapter/policy set at runtime. Rates/tariffs/mandatory
fields are versioned data; logic lives in swappable adapters. The core contains
no `if (italy)` branches — enforced by the boundary lint (core must not import
`compliance`/`integrations`).

## Consequences

- New markets = new adapter sets + profiles, not core changes.
- Compliance is a strategic, isolated module — testable independently.
