# Project Vesta

Modular hotel property-management platform (PMS). Initial market: South Tyrol / Italy.
Architecture: modular monolith (NestJS) + Next.js, PostgreSQL with row-level security
multi-tenancy, hexagonal integrations hub, jurisdiction-profile compliance layer.

> Full architecture & roadmap: `docs/adr/` and the approved plan in
> `~/.claude/plans/du-bist-mein-lead-noble-shell.md`.

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
pnpm --filter @vesta/api prisma:migrate             # apply schema + RLS
pnpm dev                                            # api + web + worker
```

## Common scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run all apps in watch mode |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Type-check the workspace |
| `pnpm lint` | Lint the workspace |
| `pnpm test` | Run tests (Vitest; integration tests need Docker) |
| `pnpm boundaries` | Enforce modular-monolith dependency rules |

## Deployment topologies

- **SaaS (pooled):** multi-tenant, managed infra, `VESTA_DEPLOYMENT_MODE=saas`.
- **Self-host (single tenant):** the `infra/docker-compose.yml` bundle on the
  hotel's own server, `VESTA_DEPLOYMENT_MODE=self-host`. Identical code path;
  row-level security still active (exactly one tenant).
