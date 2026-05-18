import { Injectable, NotFoundException } from '@nestjs/common';
import type { TenantDto } from '@vesta/api-contracts';
import { PrismaService } from '../../platform/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tenant is the isolation root (registry table, not row-level-secured). */
  async getById(tenantId: string): Promise<TenantDto> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return { id: tenant.id, name: tenant.name };
  }
}
