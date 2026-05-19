/**
 * Idempotent dev seed.
 *
 * Base: one tenant + admin (+RBAC), a property, 4 room categories, 40 rooms,
 * a rate plan. Bulk: a full year (2026) of reservations at ~80% average
 * occupancy, generated per-room WITHOUT overlaps so the GiST exclusion
 * constraint (stay_room_no_overlap) accepts them, plus a handful of
 * unassigned upcoming reservations for the rack's "unassigned" rail.
 *
 * Deterministic (seeded PRNG) → re-running yields the same data. The bulk
 * block is skipped when reservations already exist, so a normal redeploy is
 * safe; a clean dataset is produced by resetting the tenant's domain tables
 * first (see docs/runbooks/deploy.md / the reset SQL used on the test VM).
 *
 * Tenant-scoped writes run with app.tenant_id set, exactly like
 * platform/rls.ts#withTenant.
 */
import { randomUUID } from 'node:crypto';
import { PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_NAME = 'Demo Hotel Südtirol';
const YEAR = 2026;
const SEED_TODAY = Date.UTC(2026, 4, 18); // 2026-05-18, drives stay status

// ── deterministic PRNG (mulberry32) ──
let _s = 0x56455354;
function rnd(): number {
  _s |= 0;
  _s = (_s + 0x6d2b79f5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (lo: number, hi: number): number => lo + Math.floor(rnd() * (hi - lo + 1));
function weighted(pairs: [number, number][]): number {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of pairs) {
    if ((r -= w) <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}
const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)] as T;

const LOS: [number, number][] = [
  [1, 4],
  [2, 14],
  [3, 18],
  [4, 18],
  [5, 14],
  [6, 10],
  [7, 12],
  [10, 6],
  [14, 4],
];
const GAP: [number, number][] = [
  [0, 42],
  [1, 28],
  [2, 16],
  [3, 9],
  [5, 5],
];

const FIRST = [
  'Maria',
  'Anna',
  'Elena',
  'Sofia',
  'Lukas',
  'Felix',
  'Jonas',
  'Paul',
  'Hannah',
  'Laura',
  'Markus',
  'Andreas',
  'Julia',
  'Katharina',
  'Thomas',
  'Stefan',
  'Giulia',
  'Marco',
  'Francesca',
  'Alessandro',
  'Chiara',
  'Matteo',
  'Sarah',
  'David',
  'Lena',
] as const;
const LAST = [
  'Gruber',
  'Hofer',
  'Pichler',
  'Mair',
  'Kofler',
  'Unterberger',
  'Rossi',
  'Bianchi',
  'Ferrari',
  'Esposito',
  'Müller',
  'Schmidt',
  'Huber',
  'Wieser',
  'Tschurtschenthaler',
  'Pernthaler',
  'Oberhauser',
  'Holzer',
  'Rizzo',
  'Greco',
  'Bauer',
  'Egger',
] as const;
const COUNTRIES = ['IT', 'IT', 'IT', 'IT', 'IT', 'DE', 'DE', 'DE', 'AT', 'AT', 'CH'] as const;
const NOTES = [
  'Späte Anreise ggü. 22:00',
  'Allergie: Nüsse',
  'Hochzeitstag — bitte Aufmerksamkeit',
  'Babybett benötigt',
  'Ruhiges Zimmer gewünscht',
  'Stammgast',
  'Halbpension gebucht',
] as const;

interface RoomTypeSpec {
  code: string;
  name: string;
  capacity: number;
  count: number;
  rateMinor: number;
  floor: number;
}
const TYPES: RoomTypeSpec[] = [
  {
    code: 'STD',
    name: 'Standard Doppelzimmer',
    capacity: 2,
    count: 18,
    rateMinor: 12000,
    floor: 1,
  },
  { code: 'SUP', name: 'Superior', capacity: 2, count: 12, rateMinor: 16000, floor: 2 },
  { code: 'JUN', name: 'Junior Suite', capacity: 3, count: 7, rateMinor: 22000, floor: 3 },
  { code: 'SUITE', name: 'Panorama Suite', capacity: 4, count: 3, rateMinor: 32000, floor: 4 },
];

const dayToDate = (dayIdx: number): Date => new Date(Date.UTC(YEAR, 0, 1) + dayIdx * 86_400_000);
const yearLen = (): number =>
  Math.round((Date.UTC(YEAR + 1, 0, 1) - Date.UTC(YEAR, 0, 1)) / 86_400_000); // 365

async function withTenant<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return fn(tx);
    },
    { timeout: 120_000, maxWait: 15_000 },
  );
}

function makeGuest(tenantId: string): { id: string } & Prisma.GuestCreateManyInput {
  const id = randomUUID();
  const firstName = pick(FIRST);
  const lastName = pick(LAST);
  const countryCode = pick(COUNTRIES);
  return {
    id,
    tenantId,
    firstName,
    lastName,
    email: `${firstName}.${lastName}@example.com`.toLowerCase(),
    countryCode,
  };
}

async function main(): Promise<void> {
  const tenant =
    (await prisma.tenant.findFirst({ where: { name: TENANT_NAME } })) ??
    (await prisma.tenant.create({ data: { name: TENANT_NAME } }));

  await withTenant(tenant.id, async (tx) => {
    const admin = await tx.appUser.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.local' } },
      update: {},
      create: {
        tenantId: tenant.id,
        email: 'admin@demo.local',
        name: 'Demo Admin',
        status: 'active',
      },
    });
    const role = await tx.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'admin' } },
      update: {},
      create: { tenantId: tenant.id, name: 'admin' },
    });
    const perm = await tx.permission.upsert({
      where: { key: 'reservation:manage' },
      update: {},
      create: { key: 'reservation:manage', description: 'Manage reservations' },
    });
    await tx.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });
    await tx.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: role.id } },
      update: {},
      create: { userId: admin.id, roleId: role.id, tenantId: tenant.id },
    });

    let property = await tx.property.findFirst({
      where: { tenantId: tenant.id, name: 'Hotel Vesta Demo' },
    });
    property ??= await tx.property.create({
      data: { tenantId: tenant.id, name: 'Hotel Vesta Demo' },
    });

    const ratePlan = await tx.ratePlan.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'BAR' } },
      update: {},
      create: {
        tenantId: tenant.id,
        propertyId: property.id,
        code: 'BAR',
        name: 'Best Available Rate',
        baseAmountMinor: 14500,
      },
    });

    // Room types + physical rooms (idempotent on natural keys).
    const roomsByType: { spec: RoomTypeSpec; roomTypeId: string; roomIds: string[] }[] = [];
    for (const spec of TYPES) {
      const rt = await tx.roomType.upsert({
        where: { propertyId_code: { propertyId: property.id, code: spec.code } },
        update: { name: spec.name, capacity: spec.capacity, totalUnits: spec.count },
        create: {
          tenantId: tenant.id,
          propertyId: property.id,
          code: spec.code,
          name: spec.name,
          capacity: spec.capacity,
          totalUnits: spec.count,
        },
      });
      const roomIds: string[] = [];
      for (let i = 0; i < spec.count; i++) {
        const number = `${spec.floor}${String(i + 1).padStart(2, '0')}`;
        const room = await tx.room.upsert({
          where: { propertyId_number: { propertyId: property.id, number } },
          update: {},
          create: {
            tenantId: tenant.id,
            propertyId: property.id,
            roomTypeId: rt.id,
            number,
          },
        });
        roomIds.push(room.id);
      }
      roomsByType.push({ spec, roomTypeId: rt.id, roomIds });
    }

    const existing = await tx.reservation.count();
    if (existing > 50) {
      // eslint-disable-next-line no-console
      console.log(`Bulk skipped (${existing} reservations already present).`);
      return;
    }

    const N = yearLen();
    const todayIdx = Math.round((SEED_TODAY - Date.UTC(YEAR, 0, 1)) / 86_400_000);
    const guests: Prisma.GuestCreateManyInput[] = [];
    const reservations: Prisma.ReservationCreateManyInput[] = [];
    const stays: Prisma.StayCreateManyInput[] = [];

    const addBooking = (
      roomTypeId: string,
      spec: RoomTypeSpec,
      roomId: string | null,
      ci: number,
      co: number,
    ): void => {
      const g = makeGuest(tenant.id);
      guests.push(g);
      const nights = co - ci;
      const adults = int(1, spec.capacity);
      const children = rnd() < 0.15 ? int(1, 2) : 0;
      let status: Prisma.ReservationCreateManyInput['status'];
      if (rnd() < 0.03) status = 'cancelled';
      else if (co <= todayIdx) status = 'checked_out';
      else if (ci <= todayIdx && todayIdx < co) status = 'checked_in';
      else status = 'confirmed';
      const resId = randomUUID();
      reservations.push({
        id: resId,
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId,
        ratePlanId: ratePlan.id,
        guestId: g.id,
        status,
        arrival: dayToDate(ci),
        departure: dayToDate(co),
        adults,
        children,
        totalAmountMinor: spec.rateMinor * nights,
        currency: 'EUR',
        source: pick(['direct', 'direct', 'booking.com', 'expedia', 'phone']),
        ...(rnd() < 0.08 ? { notes: pick(NOTES) } : {}),
      });
      stays.push({
        id: randomUUID(),
        tenantId: tenant.id,
        reservationId: resId,
        roomTypeId,
        ...(roomId ? { roomId } : {}),
        checkIn: dayToDate(ci),
        checkOut: dayToDate(co),
      });
    };

    // Per-room non-overlapping occupancy across the year (~80% on average).
    for (const { spec, roomTypeId, roomIds } of roomsByType) {
      for (const roomId of roomIds) {
        let pos = int(0, 5);
        while (pos < N) {
          const los = weighted(LOS);
          if (pos + los > N) break;
          addBooking(roomTypeId, spec, roomId, pos, pos + los);
          pos += los + weighted(GAP);
        }
      }
    }

    // Unassigned upcoming arrivals (next ~10 days) → the rack's rail.
    for (let i = 0; i < 12; i++) {
      const { spec, roomTypeId } = pick(roomsByType);
      const ci = todayIdx + int(0, 10);
      addBooking(roomTypeId, spec, null, ci, ci + int(2, 5));
    }

    await tx.guest.createMany({ data: guests });
    await tx.reservation.createMany({ data: reservations });
    await tx.stay.createMany({ data: stays });

    // eslint-disable-next-line no-console
    console.log(
      `Bulk: ${roomsByType.reduce((s, r) => s + r.roomIds.length, 0)} rooms, ` +
        `${reservations.length} reservations (${stays.filter((s) => !s.roomId).length} unassigned).`,
    );
  });

  // eslint-disable-next-line no-console
  console.log(`Seed complete for tenant "${TENANT_NAME}" (${tenant.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
