-- Baseline: tenant registry + two tenant-scoped tables, with row-level
-- security as defense-in-depth (see docs/adr/0003). FORCE RLS so even the
-- table owner is subject to the policy; an unset app.tenant_id => no rows
-- (default deny).

CREATE TABLE "tenant" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "app_user" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"  uuid NOT NULL REFERENCES "tenant"("id"),
  "email"      text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "app_user_tenant_id_idx" ON "app_user" ("tenant_id");

CREATE TABLE "audit_log" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"  uuid NOT NULL REFERENCES "tenant"("id"),
  "action"     text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "audit_log_tenant_id_idx" ON "audit_log" ("tenant_id");

ALTER TABLE "app_user"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app_user"  FORCE  ROW LEVEL SECURITY;
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_app_user" ON "app_user"
  USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation_audit_log" ON "audit_log"
  USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid);
