-- Iteration 2: room rack (additive). Init + 0001 are left untouched.
-- Adds: room housekeeping status enum, room_block (maintenance/out-of-order/
-- hold), the indexes the bounded rack query needs, and a GiST exclusion
-- constraint that makes a room double-booking physically impossible under
-- concurrency (assigned stays may not overlap on the same room).

-- ── room.status: free text → enum (USING cast, unknown values → 'clean') ──
CREATE TYPE "room_housekeeping_status" AS ENUM
  ('clean','dirty','inspected','out_of_order');

ALTER TABLE "room" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "room" ALTER COLUMN "status" TYPE "room_housekeeping_status"
  USING (
    CASE
      WHEN "status" IN ('clean','dirty','inspected','out_of_order')
        THEN "status"::"room_housekeeping_status"
      ELSE 'clean'::"room_housekeeping_status"
    END
  );
ALTER TABLE "room" ALTER COLUMN "status" SET DEFAULT 'clean';

-- ── room blocking / maintenance ──
CREATE TYPE "room_block_reason" AS ENUM ('maintenance','out_of_order','hold');

CREATE TABLE "room_block" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"   uuid NOT NULL REFERENCES "tenant"("id"),
  "property_id" uuid NOT NULL REFERENCES "property"("id"),
  "room_id"     uuid NOT NULL REFERENCES "room"("id"),
  "start_date"  date NOT NULL,
  "end_date"    date NOT NULL,
  "reason"      "room_block_reason" NOT NULL,
  "note"        text,
  "created_at"  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "room_block_tenant_id_idx"      ON "room_block" ("tenant_id");
CREATE INDEX "room_block_room_id_start_idx"  ON "room_block" ("room_id","start_date");

-- ── rack query index (reservation(property_id,arrival) already exists) ──
CREATE INDEX "stay_room_id_check_in_idx" ON "stay" ("room_id","check_in");

-- ── no two assigned stays may overlap on the same room (DB-guaranteed) ──
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "stay" ADD CONSTRAINT "stay_room_no_overlap"
  EXCLUDE USING gist (
    "room_id" WITH =,
    daterange("check_in", "check_out", '[)') WITH &&
  ) WHERE ("room_id" IS NOT NULL);

-- ── row-level security for the new tenant-scoped table ──
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['room_block'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%1$s ON %1$I '
      'USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid) '
      'WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)', t);
  END LOOP;
END $$;
