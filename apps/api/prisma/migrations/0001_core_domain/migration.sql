-- Iteration 1: core domain (additive). The init migration is left untouched.
-- Every tenant-scoped table gets tenant_id + RLS (ENABLE + FORCE), mirroring
-- the baseline. `permission` and `role_permission` are a global catalog/join
-- and intentionally NOT row-level-secured.

-- ── extend app_user ──
ALTER TABLE "app_user"
  ADD COLUMN "name"          text,
  ADD COLUMN "password_hash" text,
  ADD COLUMN "status"        text NOT NULL DEFAULT 'active';
ALTER TABLE "app_user"
  ADD CONSTRAINT "app_user_tenant_id_email_key" UNIQUE ("tenant_id", "email");

-- ── enum ──
CREATE TYPE "reservation_status" AS ENUM
  ('enquiry','confirmed','cancelled','checked_in','checked_out','no_show');

-- ── identity & access ──
CREATE TABLE "role" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"  uuid NOT NULL REFERENCES "tenant"("id"),
  "name"       text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "role_tenant_id_name_key" UNIQUE ("tenant_id","name")
);
CREATE INDEX "role_tenant_id_idx" ON "role" ("tenant_id");

CREATE TABLE "permission" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key"         text NOT NULL UNIQUE,
  "description" text
);

CREATE TABLE "role_permission" (
  "role_id"       uuid NOT NULL REFERENCES "role"("id"),
  "permission_id" uuid NOT NULL REFERENCES "permission"("id"),
  PRIMARY KEY ("role_id","permission_id")
);

CREATE TABLE "user_role" (
  "user_id"   uuid NOT NULL REFERENCES "app_user"("id"),
  "role_id"   uuid NOT NULL REFERENCES "role"("id"),
  "tenant_id" uuid NOT NULL REFERENCES "tenant"("id"),
  PRIMARY KEY ("user_id","role_id")
);
CREATE INDEX "user_role_tenant_id_idx" ON "user_role" ("tenant_id");

-- ── property setup ──
CREATE TABLE "property" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"  uuid NOT NULL REFERENCES "tenant"("id"),
  "name"       text NOT NULL,
  "timezone"   text NOT NULL DEFAULT 'Europe/Rome',
  "currency"   text NOT NULL DEFAULT 'EUR',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "property_tenant_id_idx" ON "property" ("tenant_id");

CREATE TABLE "room_type" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"   uuid NOT NULL REFERENCES "tenant"("id"),
  "property_id" uuid NOT NULL REFERENCES "property"("id"),
  "code"        text NOT NULL,
  "name"        text NOT NULL,
  "capacity"    integer NOT NULL DEFAULT 2,
  "total_units" integer NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "room_type_property_id_code_key" UNIQUE ("property_id","code")
);
CREATE INDEX "room_type_tenant_id_idx" ON "room_type" ("tenant_id");

CREATE TABLE "room" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    uuid NOT NULL REFERENCES "tenant"("id"),
  "property_id"  uuid NOT NULL REFERENCES "property"("id"),
  "room_type_id" uuid NOT NULL REFERENCES "room_type"("id"),
  "number"       text NOT NULL,
  "status"       text NOT NULL DEFAULT 'clean',
  CONSTRAINT "room_property_id_number_key" UNIQUE ("property_id","number")
);
CREATE INDEX "room_tenant_id_idx" ON "room" ("tenant_id");

CREATE TABLE "rate_plan" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"         uuid NOT NULL REFERENCES "tenant"("id"),
  "property_id"       uuid NOT NULL REFERENCES "property"("id"),
  "code"              text NOT NULL,
  "name"              text NOT NULL,
  "currency"          text NOT NULL DEFAULT 'EUR',
  "base_amount_minor" integer NOT NULL,
  "created_at"        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "rate_plan_property_id_code_key" UNIQUE ("property_id","code")
);
CREATE INDEX "rate_plan_tenant_id_idx" ON "rate_plan" ("tenant_id");

-- ── guests & reservations ──
CREATE TABLE "guest" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    uuid NOT NULL REFERENCES "tenant"("id"),
  "first_name"   text NOT NULL,
  "last_name"    text NOT NULL,
  "email"        text,
  "phone"        text,
  "country_code" text,
  "created_at"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "guest_tenant_id_idx" ON "guest" ("tenant_id");

CREATE TABLE "reservation" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"          uuid NOT NULL REFERENCES "tenant"("id"),
  "property_id"        uuid NOT NULL REFERENCES "property"("id"),
  "room_type_id"       uuid NOT NULL REFERENCES "room_type"("id"),
  "rate_plan_id"       uuid NOT NULL REFERENCES "rate_plan"("id"),
  "guest_id"           uuid NOT NULL REFERENCES "guest"("id"),
  "status"             "reservation_status" NOT NULL DEFAULT 'enquiry',
  "arrival"            date NOT NULL,
  "departure"          date NOT NULL,
  "adults"             integer NOT NULL DEFAULT 2,
  "children"           integer NOT NULL DEFAULT 0,
  "total_amount_minor" integer NOT NULL,
  "currency"           text NOT NULL DEFAULT 'EUR',
  "source"             text NOT NULL DEFAULT 'direct',
  "external_ref"       text,
  "notes"              text,
  "created_at"         timestamptz NOT NULL DEFAULT now(),
  "updated_at"         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "reservation_tenant_id_idx" ON "reservation" ("tenant_id");
CREATE INDEX "reservation_property_id_arrival_idx" ON "reservation" ("property_id","arrival");

CREATE TABLE "stay" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"      uuid NOT NULL REFERENCES "tenant"("id"),
  "reservation_id" uuid NOT NULL REFERENCES "reservation"("id"),
  "room_type_id"   uuid NOT NULL REFERENCES "room_type"("id"),
  "room_id"        uuid REFERENCES "room"("id"),
  "check_in"       date NOT NULL,
  "check_out"      date NOT NULL
);
CREATE INDEX "stay_tenant_id_idx" ON "stay" ("tenant_id");

-- ── billing ──
CREATE TABLE "invoice" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"      uuid NOT NULL REFERENCES "tenant"("id"),
  "reservation_id" uuid NOT NULL REFERENCES "reservation"("id"),
  "number"         text NOT NULL,
  "status"         text NOT NULL DEFAULT 'draft',
  "total_minor"    integer NOT NULL,
  "currency"       text NOT NULL DEFAULT 'EUR',
  "issued_at"      timestamptz,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "invoice_tenant_id_number_key" UNIQUE ("tenant_id","number")
);
CREATE INDEX "invoice_tenant_id_idx" ON "invoice" ("tenant_id");

CREATE TABLE "payment" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    uuid NOT NULL REFERENCES "tenant"("id"),
  "invoice_id"   uuid NOT NULL REFERENCES "invoice"("id"),
  "amount_minor" integer NOT NULL,
  "currency"     text NOT NULL DEFAULT 'EUR',
  "method"       text NOT NULL DEFAULT 'cash',
  "status"       text NOT NULL DEFAULT 'captured',
  "created_at"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "payment_tenant_id_idx" ON "payment" ("tenant_id");

-- ── integrations ──
CREATE TABLE "integration_connection" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"     uuid NOT NULL REFERENCES "tenant"("id"),
  "connector_key" text NOT NULL,
  "display_name"  text NOT NULL,
  "status"        text NOT NULL DEFAULT 'disconnected',
  "config"        jsonb,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "integration_connection_tenant_id_connector_key_key" UNIQUE ("tenant_id","connector_key")
);
CREATE INDEX "integration_connection_tenant_id_idx" ON "integration_connection" ("tenant_id");

CREATE TABLE "external_mapping" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"     uuid NOT NULL REFERENCES "tenant"("id"),
  "connection_id" uuid NOT NULL REFERENCES "integration_connection"("id"),
  "entity_type"   text NOT NULL,
  "internal_id"   text NOT NULL,
  "external_id"   text NOT NULL,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "external_mapping_connection_id_entity_type_external_id_key" UNIQUE ("connection_id","entity_type","external_id")
);
CREATE INDEX "external_mapping_tenant_id_idx" ON "external_mapping" ("tenant_id");

CREATE TABLE "integration_inbox" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"     uuid NOT NULL REFERENCES "tenant"("id"),
  "connection_id" uuid NOT NULL REFERENCES "integration_connection"("id"),
  "dedup_key"     text NOT NULL,
  "payload"       jsonb NOT NULL,
  "status"        text NOT NULL DEFAULT 'received',
  "received_at"   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "integration_inbox_connection_id_dedup_key_key" UNIQUE ("connection_id","dedup_key")
);
CREATE INDEX "integration_inbox_tenant_id_idx" ON "integration_inbox" ("tenant_id");

-- ── row-level security (tenant-scoped tables only) ──
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'role','user_role','property','room_type','room','rate_plan','guest',
    'reservation','stay','invoice','payment',
    'integration_connection','external_mapping','integration_inbox'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%1$s ON %1$I '
      'USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid) '
      'WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)', t);
  END LOOP;
END $$;
