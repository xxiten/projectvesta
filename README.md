# Project Vesta

Modular hotel property-management platform (PMS). Initial market: South Tyrol / Italy.
Architecture: modular monolith (NestJS) + Next.js, PostgreSQL with row-level security
multi-tenancy, hexagonal integrations hub, jurisdiction-profile compliance layer.

> Full architecture & roadmap: `docs/adr/` and the approved plan in
> `~/.claude/plans/du-bist-mein-lead-noble-shell.md`.

**Status:** E0 foundation done + deployed. Iteration 1 adds the core domain
(schema + RLS), real endpoints (tenants/properties/reservations/integrations)
with code-first OpenAPI at `/docs`, the integrations connector skeleton, and the
**Reservation vertical slice** end-to-end (placeholder login via seeded tenant).

## Repository layout

```
apps/api      NestJS modular monolith (domain modules, shared-kernel, platform)
apps/web      Next.js App Router frontend
apps/worker   BullMQ worker (outbox relay, sync jobs)
packages/*    design-system, api-contracts, integration-contracts, i18n, config, tsconfig, eslint-config
infra/        docker-compose self-host bundle, (terraform later)
docs/         ADRs, domain glossary, runbooks
```

## Prerequisites

- Node.js 22+
- pnpm 9 (`npm i -g pnpm@9.15.0`)
- Docker (for local PostgreSQL / Redis / MinIO and the self-host bundle)

## Getting started

```bash
pnpm install
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d   # postgres, redis, minio
pnpm --filter @vesta/api prisma:deploy              # apply schema + RLS (init + 0001)
pnpm --filter @vesta/api db:seed                    # demo tenant, property, reservation
pnpm dev                                            # api + web + worker
```

Then: API docs at `http://localhost:3001/docs`, web at `http://localhost:3000`
(click **Demo-Login** — uses the seeded tenant via the dev-only
`/dev/context`).

## Common scripts

| Command                                   | Purpose                                           |
| ----------------------------------------- | ------------------------------------------------- |
| `pnpm dev`                                | Run all apps in watch mode                        |
| `pnpm build`                              | Build all packages and apps                       |
| `pnpm typecheck`                          | Type-check the workspace                          |
| `pnpm lint`                               | Lint the workspace                                |
| `pnpm test`                               | Run tests (Vitest; integration tests need Docker) |
| `pnpm boundaries`                         | Enforce modular-monolith dependency rules         |
| `pnpm --filter @vesta/api db:seed`        | Seed the demo tenant + sample data                |
| `pnpm --filter @vesta/api openapi:export` | Write `packages/api-contracts/openapi.json`       |

## Deployment topologies

- **SaaS (pooled):** multi-tenant, managed infra, `VESTA_DEPLOYMENT_MODE=saas`.
- **Self-host (single tenant):** the `infra/docker-compose.yml` bundle on the
  hotel's own server, `VESTA_DEPLOYMENT_MODE=self-host`. Identical code path;
  row-level security still active (exactly one tenant).
