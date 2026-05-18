import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';

/**
 * E0 Definition-of-Done: prove that row-level security isolates tenants —
 * tenant A must never see tenant B's rows, and cannot write rows for B.
 *
 * Requires Docker. Enable with: RUN_DB_TESTS=1 pnpm --filter @vesta/api test
 */
const RUN = process.env.RUN_DB_TESTS === '1';
const suite = RUN ? describe : describe.skip;

const here = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(here, '..', 'prisma', 'migrations', '00000000000000_init', 'migration.sql');

suite('RLS tenant isolation', () => {
  let container: StartedPostgreSqlContainer;
  let db: Client;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    db = new Client({ connectionString: container.getConnectionUri() });
    await db.connect();
    await db.query(await readFile(migrationPath, 'utf8'));

    const a = await db.query("INSERT INTO tenant(name) VALUES ('Hotel A') RETURNING id");
    const b = await db.query("INSERT INTO tenant(name) VALUES ('Hotel B') RETURNING id");
    tenantA = a.rows[0].id;
    tenantB = b.rows[0].id;

    // Seed audit rows for both tenants (RLS off for this privileged setup path
    // would normally be a migration/seed; here we set the GUC per insert).
    await db.query("SELECT set_config('app.tenant_id', $1, false)", [tenantA]);
    await db.query("INSERT INTO audit_log(tenant_id, action) VALUES ($1, 'a1')", [tenantA]);
    await db.query("INSERT INTO audit_log(tenant_id, action) VALUES ($1, 'a2')", [tenantA]);
    await db.query("SELECT set_config('app.tenant_id', $1, false)", [tenantB]);
    await db.query("INSERT INTO audit_log(tenant_id, action) VALUES ($1, 'b1')", [tenantB]);
  }, 120_000);

  afterAll(async () => {
    await db?.end();
    await container?.stop();
  });

  it('only returns rows for the tenant in app.tenant_id', async () => {
    await db.query("SELECT set_config('app.tenant_id', $1, false)", [tenantA]);
    const rows = await db.query('SELECT action FROM audit_log ORDER BY action');
    expect(rows.rows.map((r) => r.action)).toEqual(['a1', 'a2']);
  });

  it('returns no rows when app.tenant_id is unset (default deny)', async () => {
    await db.query("SELECT set_config('app.tenant_id', '', false)");
    const rows = await db.query('SELECT count(*)::int AS n FROM audit_log');
    expect(rows.rows[0].n).toBe(0);
  });

  it('forbids writing a row for another tenant (WITH CHECK)', async () => {
    await db.query("SELECT set_config('app.tenant_id', $1, false)", [tenantA]);
    await expect(
      db.query("INSERT INTO audit_log(tenant_id, action) VALUES ($1, 'x')", [tenantB]),
    ).rejects.toThrow();
  });
});
