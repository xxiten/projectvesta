# ADR-0011: Dual deployment topology

Status: Accepted — 2026-05-18

## Context

The product is sold as pooled SaaS but must also be deployable on a single
hotel's own server (self-host). These cannot diverge into two codebases.

## Decision

One artifact, two topologies:

- **SaaS:** pooled multi-tenant, managed EU infra, `VESTA_DEPLOYMENT_MODE=saas`.
- **Self-host:** a self-contained `docker compose` bundle (api, web, worker,
  postgres, redis, minio) on the customer's server,
  `VESTA_DEPLOYMENT_MODE=self-host`, exactly one tenant.

No hard lock-in to managed cloud services: storage/queue/DB sit behind ports;
config and secrets come from validated env (no cloud-only SDK at that layer).
Releases are versioned with idempotent migrations (self-host upgrades on its own
cadence).

## Consequences

- RLS stays active even with one tenant (no special path).
- New open risk: licensing/distribution and upgrade discipline for self-host
  (to be addressed before R2).
