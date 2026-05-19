# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Project Vesta — modular hotel PMS. Initial market South Tyrol/Italy; German is the working
language for product/docs/UI. Full architecture lives in `docs/adr/0001…0012` and
`docs/domain/`. The authoritative plan is `~/.claude/plans/du-bist-mein-lead-noble-shell.md`.

## Commands

pnpm 9 + Turborepo monorepo. Root scripts fan out via `turbo`:

- `pnpm dev` — api + web + worker in watch mode
- `pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm test` — workspace-wide
- `pnpm boundaries` — **modular-monolith dependency enforcement** (`.dependency-cruiser.cjs`); part of the definition of done, run it after touching module imports
- Per package: `pnpm --filter @vesta/api <script>` (also `@vesta/web`, `@vesta/worker`)
- Single test: `pnpm --filter @vesta/api test -- <file-or-pattern>` (Vitest)
- DB: `pnpm --filter @vesta/api prisma:deploy` (apply migrations), `db:seed` (idempotent demo data), `openapi:export` (regenerate `packages/api-contracts/openapi.json`)

Local stack: `docker compose -f infra/docker-compose.yml up -d` (postgres/redis/minio), then `prisma:deploy` + `db:seed` + `pnpm dev`. API docs at `:3001/docs`, web at `:3000` (Demo-Login uses the seeded tenant via the dev-only `/dev/context`).

### Test scope gotchas

- The RLS tenant-isolation test (`apps/api/test/rls-tenant-isolation.spec.ts`) is `describe.skip` unless `RUN_DB_TESTS=1` and needs Docker (testcontainers). It is therefore not exercised in normal `pnpm test`.
- `apps/api` typecheck/lint only cover `src` (`tsconfig include:["src"]`, `eslint src`). **`prisma/seed.ts` and `prisma/migrations` are not type-checked or linted** — verify seed changes manually (e.g. standalone `tsc --noEmit`).
- `apps/web` lint covers `app lib features`.

## Architecture invariants

These cut across many files and are easy to violate:

**Module boundaries.** `apps/api/src/modules/<domain>/` each expose a public surface
(`index.ts` / `*.public.ts`). Cross-module access goes through that surface or domain
events only — never deep imports. Core domains (`inventory`, `rate-pricing`, `reservation`)
must not import `integrations` or `compliance` (dependency inversion: core defines ports,
adapters implement). `pnpm boundaries` enforces this. Example: `front-desk` orchestrates
stay/reservation writes via `reservation/reservation.public.ts` (`STAY_ASSIGNMENT_PORT`),
not by importing `ReservationService` directly.

**Multi-tenancy via Postgres RLS.** Every tenant-scoped DB access MUST run inside
`withTenant(prisma, tenantId, fn)` (`apps/api/src/platform/rls.ts`), which sets the
`app.tenant_id` GUC inside a transaction so RLS policies resolve. Request scope comes from
`@Ctx()` (`platform/current-context.decorator.ts`) bound by tenant-context middleware;
auth is behind `AuthPort` with a dev `DevHeaderAuthAdapter` that trusts
`x-tenant-id`/`x-user-id` headers (placeholder auth, ADR-0006). A read model that only
projects across aggregates (e.g. the room rack) may query tables directly within
`withTenant` without violating boundaries.

> **Known critical gap:** the app connects to Postgres as a superuser/BYPASSRLS role, so
> RLS is currently _not actually enforced_ (cross-tenant reads succeed). This is
> pre-existing and must be fixed (least-privilege app role) before any real tenant data.
> Do not assume tenant isolation works just because policies exist.

**Migrations are hand-written and additive.** `schema.prisma` and the SQL in
`prisma/migrations/<n>_*/migration.sql` must stay in lockstep — Prisma does **not** model
RLS. Never rewrite an existing migration; add a new one. Every new tenant-scoped table
needs `ENABLE` + `FORCE ROW LEVEL SECURITY` + a `tenant_isolation_*` policy via the
`DO $$ … FOREACH` pattern used in `0001_core_domain`. `0002_room_rack` adds a GiST
`EXCLUDE` constraint (`btree_gist`) preventing overlapping room assignments — its raw
Postgres error (`23P01` / `stay_room_no_overlap`) is translated to a 409; deploying it
requires `CREATE EXTENSION btree_gist` privilege (no silent fallback).

**API contracts.** Hand-authored types in `packages/api-contracts/src/index.ts` are the
single BE↔FE source of truth; both apps import them directly. OpenAPI is generated
code-first from `@nestjs/swagger` decorators (ADR-0005 refined by 0012), not the other way
around.

**Web ↔ API.** Same-origin: `apps/web/app/api/[...path]/route.ts` proxies `/api/*` to
`API_PROXY_TARGET` at request time. Do **not** reintroduce `next.config` rewrites — they
bake at build and break the portable prebuilt image.

**i18n.** The `Messages` type derives from `packages/i18n/src/messages/de.json`; a new key
must be added to `de.json`, `en.json`, and `it.json` together.

## Conventions

- Extensionless TS imports (no `.js` suffix) — required for NestJS resolution.
- The shared ESLint config has **no react-hooks plugin** and disables
  `consistent-type-imports` (NestJS DI needs value imports). Don't add
  `// eslint-disable … react-hooks/exhaustive-deps` — it errors as an unknown rule.
- Conventional Commits; a husky `lint-staged` hook runs Prettier on commit.
- Frontend: feature code under `apps/web/features/<feature>/`; reusable UI in
  `packages/design-system` (source-only, Tailwind + tokens, consumed via transpile).
  Memoize objects passed into effect deps (an unstable `scope` object once caused an
  infinite refetch loop in the room rack).

## Deployment

GHCR pull-based: `.github/workflows/release.yml` builds & pushes
`ghcr.io/<owner>/vesta-{api,web,worker}` (`latest` + `sha-<short>`) on push to `main`;
hosts pull, never build. Pin/rollback via `VESTA_IMAGE_TAG=sha-<short>` in `.env`. Compose
files run with project `-p infra` to preserve the seeded volume. Runbook:
`docs/runbooks/deploy.md`. Dual topology (ADR-0011): pooled SaaS vs. single-tenant
self-host, identical images, `VESTA_DEPLOYMENT_MODE`. The live test environment is a
LAN-only Proxmox VM (HTTP on :3000, no TLS).
