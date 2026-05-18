import type { Prisma } from '@prisma/client';
import type { PrismaService } from './prisma.service';

/**
 * Runs `fn` inside a transaction whose `app.tenant_id` GUC is set, so every
 * row-level-security policy resolves to the given tenant. This is the ONLY
 * sanctioned way to read/write tenant data — defense in depth against a query
 * that forgets its tenant filter (see docs/adr/0003).
 */
export async function withTenant<T>(
  prisma: PrismaService,
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // `true` => setting is scoped to the current transaction only.
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}
