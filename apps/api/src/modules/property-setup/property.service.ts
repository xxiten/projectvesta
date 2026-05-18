import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreatePropertyInput,
  PropertyDto,
  RatePlanDto,
  RoomTypeDto,
} from '@vesta/api-contracts';
import { PrismaService } from '../../platform/prisma.service';
import { withTenant } from '../../platform/rls';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string): Promise<PropertyDto[]> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const rows = await tx.property.findMany({ orderBy: { createdAt: 'asc' } });
      return rows.map((p) => ({
        id: p.id,
        name: p.name,
        timezone: p.timezone,
        currency: p.currency,
      }));
    });
  }

  create(tenantId: string, input: CreatePropertyInput): Promise<PropertyDto> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const p = await tx.property.create({
        data: {
          tenantId,
          name: input.name,
          ...(input.timezone ? { timezone: input.timezone } : {}),
          ...(input.currency ? { currency: input.currency } : {}),
        },
      });
      return { id: p.id, name: p.name, timezone: p.timezone, currency: p.currency };
    });
  }

  getById(tenantId: string, id: string): Promise<PropertyDto> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const p = await tx.property.findUnique({ where: { id } });
      if (!p) throw new NotFoundException('Property not found');
      return { id: p.id, name: p.name, timezone: p.timezone, currency: p.currency };
    });
  }

  listRoomTypes(tenantId: string, propertyId: string): Promise<RoomTypeDto[]> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const rows = await tx.roomType.findMany({
        where: { propertyId },
        orderBy: { code: 'asc' },
      });
      return rows.map((r) => ({
        id: r.id,
        propertyId: r.propertyId,
        code: r.code,
        name: r.name,
        capacity: r.capacity,
        totalUnits: r.totalUnits,
      }));
    });
  }

  listRatePlans(tenantId: string, propertyId: string): Promise<RatePlanDto[]> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const rows = await tx.ratePlan.findMany({
        where: { propertyId },
        orderBy: { code: 'asc' },
      });
      return rows.map((r) => ({
        id: r.id,
        propertyId: r.propertyId,
        code: r.code,
        name: r.name,
        currency: r.currency,
        baseAmountMinor: r.baseAmountMinor,
      }));
    });
  }
}
