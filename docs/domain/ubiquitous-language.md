# Ubiquitous Language

Shared vocabulary across code, UI and conversation. Keep terms stable; if a term
changes, change it everywhere.

| Term | Definition |
| --- | --- |
| **Tenant** | A customer (hotel business). Root of data isolation. |
| **Property** | A single hotel/house belonging to a tenant. |
| **Room Type** | A category of rooms sold as one inventory bucket. |
| **Room / Unit** | A physical, assignable room of a room type. |
| **Rate Plan** | A named pricing scheme (with restrictions) for a room type. |
| **Availability** | Sellable units of a room type for a given date. Never negative; no overbooking without an explicit limit. |
| **Reservation** | A booking; moves through a status machine (enquiry → option → confirmed → checked-in → checked-out / cancelled / no-show). Holds inventory atomically when confirmed. |
| **Stay** | One room-type occupancy over a date range within a reservation. |
| **Guest** | A person profile; subject to GDPR erasure/anonymisation. |
| **Folio** | The running account of charges for a stay. |
| **Invoice** | The legal document; immutable once finalised; gapless number per property/year. |
| **Fiscal Document** | The SDI/FatturaPA transmission tied 1:1 to an invoice. |
| **Guest Registration** | Mandatory reporting (Alloggiati Web / ASTAT). |
| **Aufenthaltsabgabe** | South Tyrol tourist levy; a folio line + periodic report. |
| **Jurisdiction Profile** | The country/region key (e.g. `IT-BZ`) selecting compliance adapters/policies. |
| **Connector** | An adapter to one external system, mapping to/from the Canonical Data Model. |
| **Canonical Data Model** | Provider-agnostic shapes the integrations hub maps onto (`@vesta/integration-contracts`). |
| **Outbox** | Table of integration events written in the same transaction as the domain change. |
| **Request Context** | The authenticated `{ tenantId, userId, roles }` scope bound per request. |
