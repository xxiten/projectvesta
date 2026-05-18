# ADR-0006: Auth — internal, behind AuthPort

Status: Accepted — 2026-05-18

## Context

EU residency and cost control argue against a third-party IdP on day one;
enterprise SSO/SAML will matter later. Decision must not be a one-way door.

## Decision

Ship an internal tenant-aware RBAC behind an `AuthPort` interface. A
development header adapter exists so the stack is exercisable end-to-end. The
port is OIDC-shaped so production can switch to Keycloak (EU self-host) or
WorkOS without touching callers.

## Consequences

- No external auth dependency or cost in the MVP.
- The dev adapter MUST be replaced before any non-local deployment.
- SSO/SAML arrives by swapping the adapter, not rewriting call sites.
