/**
 * Idempotent dev seed: one tenant + admin user (+RBAC rows), a property with
 * two room types and a rate plan, a guest and a sample reservation.
 *
 * Tenant-scoped rows are written inside a transaction with `app.tenant_id` set,
 * exactly like platform/rls.ts#withTenant — RLS (FORCE) applies to the seed too.
 */
import { PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_NAME = 'Demo Hotel Südtirol';

async function withTenant<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
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

    const standard = await tx.roomType.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'STD' } },
      update: {},
      create: {
        tenantId: tenant.id,
        propertyId: property.id,
        code: 'STD',
        name: 'Standard Doppelzimmer',
        capacity: 2,
        totalUnits: 8,
      },
    });
    await tx.roomType.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'SUITE' } },
      update: {},
      create: {
        tenantId: tenant.id,
        propertyId: property.id,
        code: 'SUITE',
        name: 'Panorama Suite',
        capacity: 3,
        totalUnits: 3,
      },
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

    let guest = await tx.guest.findFirst({
      where: { tenantId: tenant.id, email: 'gast@example.com' },
    });
    guest ??= await tx.guest.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Maria',
        lastName: 'Gruber',
        email: 'gast@example.com',
        countryCode: 'IT',
      },
    });

    const existing = await tx.reservation.count({ where: { tenantId: tenant.id } });
    if (existing === 0) {
      const arrival = new Date('2026-06-12');
      const departure = new Date('2026-06-15');
      const nights = 3;
      await tx.reservation.create({
        data: {
          tenantId: tenant.id,
          propertyId: property.id,
          roomTypeId: standard.id,
          ratePlanId: ratePlan.id,
          guestId: guest.id,
          status: 'confirmed',
          arrival,
          departure,
          adults: 2,
          totalAmountMinor: ratePlan.baseAmountMinor * nights,
          source: 'direct',
          stays: {
            create: {
              tenantId: tenant.id,
              roomTypeId: standard.id,
              checkIn: arrival,
              checkOut: departure,
            },
          },
        },
      });
    }
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
