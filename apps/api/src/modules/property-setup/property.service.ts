import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreatePropertyInput,
  CreateRoomInput,
  PropertyDto,
  RatePlanDto,
  RoomDto,
  RoomHousekeepingStatus,
  RoomTypeDto,
} from '@vesta/api-contracts';
import { PrismaService } from '../../platform/prisma.service';
import { withTenant } from '../../platform/rls';

type RoomRow = {
  id: string;
  propertyId: string;
  roomTypeId: string;
  number: string;
  status: RoomHousekeepingStatus;
};
const toRoomDto = (r: RoomRow): RoomDto => ({
  id: r.id,
  propertyId: r.propertyId,
  roomTypeId: r.roomTypeId,
  number: r.number,
  status: r.status,
});

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

  listRooms(tenantId: string, propertyId: string): Promise<RoomDto[]> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const rows = await tx.room.findMany({
        where: { propertyId },
        orderBy: { number: 'asc' },
      });
      return rows.map((r) => toRoomDto(r as unknown as RoomRow));
    });
  }

  createRoom(tenantId: string, propertyId: string, input: CreateRoomInput): Promise<RoomDto> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const roomType = await tx.roomType.findUnique({ where: { id: input.roomTypeId } });
      if (!roomType || roomType.propertyId !== propertyId) {
        throw new NotFoundException('Room type not found for this property');
      }
      const dup = await tx.room.findFirst({ where: { propertyId, number: input.number } });
      if (dup) throw new ConflictException(`Room ${input.number} already exists`);
      const room = await tx.room.create({
        data: {
          tenantId,
          propertyId,
          roomTypeId: input.roomTypeId,
          number: input.number,
        },
      });
      return toRoomDto(room as unknown as RoomRow);
    });
  }

  setHousekeeping(
    tenantId: string,
    roomId: string,
    status: RoomHousekeepingStatus,
  ): Promise<RoomDto> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) throw new NotFoundException('Room not found');
      const updated = await tx.room.update({
        where: { id: roomId },
        data: { status },
      });
      return toRoomDto(updated as unknown as RoomRow);
    });
  }
}
