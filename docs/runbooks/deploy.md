# Runbook: registry-based deploy (GHCR)

Build once in CI → push to GHCR → hosts pull. No build/source/toolchain on the
target. Rationale: ADR-0011 + reproducibility/rollback (see plan, Iteration 1).

## Image naming

`ghcr.io/<owner>/vesta-{api,web,worker}` — tags: `latest` and `sha-<short>`
(immutable; pin/rollback by SHA). Built by `.github/workflows/release.yml` on
push to `main` using `GITHUB_TOKEN` (no extra secret for the push side).

## One-time host setup

1. **GHCR read token** (packages are private): create a GitHub PAT with
   `read:packages` (classic) or a fine-grained token with package read.
2. On the host, log Docker in (stored in the host's docker config, root-only):
   ```bash
   echo "<PAT>" | docker login ghcr.io -u <github-user> --password-stdin
   ```
3. Place `infra/docker-compose.yml`, `infra/docker-compose.ghcr.yml` and a
   `.env` on the host (the only files needed — no source tree). `.env` must set
   `AUTH_JWT_SECRET`, and for a sandbox `VESTA_ENABLE_DEV_AUTH=true`.

## Deploy / update

```bash
C="-f infra/docker-compose.yml -f infra/docker-compose.ghcr.yml --env-file .env"
docker compose $C pull          # pull latest (or set VESTA_IMAGE_TAG=sha-xxxx)
docker compose $C up -d
docker compose $C exec api pnpm prisma:deploy   # apply pending migrations
# first install only:
docker compose $C exec api pnpm db:seed
```

Migrations are forward-only and additive; `prisma:deploy` is safe to re-run.

## Rollback

```bash
VESTA_IMAGE_TAG=sha-<previous> docker compose $C up -d
```

Images are immutable, so rollback is a pull of a known-good tag (seconds). Note:
a rollback does **not** revert DB migrations — migrations must stay
backward-compatible across one release.

## Air-gapped self-host (no GHCR access)

`docker save ghcr.io/<owner>/vesta-*:<tag> -o vesta.tar` → transfer →
`docker load -i vesta.tar`, then the same compose `up -d`. (Or run a local
registry mirror.)

## Pin a release

Set `VESTA_IMAGE_TAG=sha-<short>` in `.env` to freeze the host on an exact,
tested build instead of moving `latest`.
