import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateRoomBlockInput,
  RoomBlockDto,
  RoomRackDto,
  RoomRackRoomDto,
  RoomRackSegmentDto,
  UnassignedReservationDto,
} from '@vesta/api-contracts';
import { PrismaService } from '../../platform/prisma.service';
import { withTenant } from '../../platform/rls';

const MS_DAY = 86_400_000;
const MAX_WINDOW_DAYS = 31;
const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
const toUtc = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

type StayJoin = {
  id: string;
  roomId: string | null;
  roomTypeId: string;
  checkIn: Date;
  checkOut: Date;
  reservation: {
    id: string;
    status: RoomRackSegmentDto['reservationStatus'];
    arrival: Date;
    departure: Date;
    adults: number;
    children: number;
    notes: string | null;
    guest: { id: string; firstName: string; lastName: string };
  };
};

/**
 * Read model for the room rack. A single bounded projection over
 * rooms/stays/blocks/reservations within [from,to). It only READS across
 * aggregates (no cross-module import, no write into other aggregates), so the
 * modular-monolith boundary holds. Writes that touch the Stay/Reservation
 * aggregate go through the reservation public port instead.
 */
@Injectable()
export class RoomRackService {
  constructor(private readonly prisma: PrismaService) {}

  getRack(tenantId: string, propertyId: string, from: string, to: string): Promise<RoomRackDto> {
    const fromDate = toUtc(from);
    const toDate = toUtc(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid from/to date');
    }
    const days = Math.round((toDate.getTime() - fromDate.getTime()) / MS_DAY);
    if (days < 1) throw new BadRequestException('`to` must be after `from`');
    if (days > MAX_WINDOW_DAYS) {
      throw new BadRequestException(`Window too large (max ${MAX_WINDOW_DAYS} days)`);
    }

    return withTenant(this.prisma, tenantId, async (tx) => {
      const property = await tx.property.findUnique({ where: { id: propertyId } });
      if (!property) throw new NotFoundException('Property not found');

      const roomTypes = await tx.roomType.findMany({
        where: { propertyId },
        orderBy: { code: 'asc' },
        include: { rooms: { orderBy: { number: 'asc' } } },
      });

      const stays = (await tx.stay.findMany({
        where: {
          checkIn: { lt: toDate },
          checkOut: { gt: fromDate },
          reservation: { propertyId, status: { notIn: ['cancelled'] } },
        },
        include: {
          reservation: {
            select: {
              id: true,
              status: true,
              arrival: true,
              departure: true,
              adults: true,
              children: true,
              notes: true,
              guest: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      })) as unknown as StayJoin[];

      const blocks = await tx.roomBlock.findMany({
        where: { propertyId, startDate: { lt: toDate }, endDate: { gt: fromDate } },
      });

      const segmentOf = (s: StayJoin): RoomRackSegmentDto => {
        const ci = s.checkIn < fromDate ? fromDate : s.checkIn;
        const co = s.checkOut > toDate ? toDate : s.checkOut;
        return {
          stayId: s.id,
          reservationId: s.reservation.id,
          roomId: s.roomId as string,
          checkIn: isoDate(ci),
          checkOut: isoDate(co),
          clipped: s.checkIn < fromDate || s.checkOut > toDate,
          reservationStatus: s.reservation.status,
          guest: s.reservation.guest,
          adults: s.reservation.adults,
          children: s.reservation.children,
          ...(s.reservation.notes ? { notes: s.reservation.notes } : {}),
        };
      };

      const blockOf = (b: (typeof blocks)[number]): RoomBlockDto => ({
        id: b.id,
        roomId: b.roomId,
        startDate: isoDate(b.startDate),
        endDate: isoDate(b.endDate),
        reason: b.reason,
        ...(b.note ? { note: b.note } : {}),
      });

      const groups = roomTypes.map((rt) => ({
        roomTypeId: rt.id,
        code: rt.code,
        name: rt.name,
        capacity: rt.capacity,
        rooms: rt.rooms.map(
          (room): RoomRackRoomDto => ({
            id: room.id,
            number: room.number,
            housekeepingStatus: room.status,
            segments: stays.filter((s) => s.roomId === room.id).map(segmentOf),
            blocks: blocks.filter((b) => b.roomId === room.id).map(blockOf),
          }),
        ),
      }));

      const unassigned: UnassignedReservationDto[] = stays
        .filter((s) => s.roomId === null && s.reservation.status !== 'checked_out')
        .map((s) => ({
          reservationId: s.reservation.id,
          stayId: s.id,
          roomTypeId: s.roomTypeId,
          arrival: isoDate(s.reservation.arrival),
          departure: isoDate(s.reservation.departure),
          status: s.reservation.status,
          guest: s.reservation.guest,
        }));

      return { propertyId, from, to, groups, unassigned };
    });
  }

  createBlock(
    tenantId: string,
    propertyId: string,
    input: CreateRoomBlockInput,
  ): Promise<RoomBlockDto> {
    const start = toUtc(input.startDate);
    const end = toUtc(input.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new BadRequestException('`endDate` must be after `startDate`');
    }
    return withTenant(this.prisma, tenantId, async (tx) => {
      const room = await tx.room.findUnique({ where: { id: input.roomId } });
      if (!room || room.propertyId !== propertyId) {
        throw new NotFoundException('Room not found for this property');
      }
      const b = await tx.roomBlock.create({
        data: {
          tenantId,
          propertyId,
          roomId: input.roomId,
          startDate: start,
          endDate: end,
          reason: input.reason,
          ...(input.note ? { note: input.note } : {}),
        },
      });
      return {
        id: b.id,
        roomId: b.roomId,
        startDate: isoDate(b.startDate),
        endDate: isoDate(b.endDate),
        reason: b.reason,
        ...(b.note ? { note: b.note } : {}),
      };
    });
  }

  deleteBlock(tenantId: string, id: string): Promise<void> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const b = await tx.roomBlock.findUnique({ where: { id } });
      if (!b) throw new NotFoundException('Room block not found');
      await tx.roomBlock.delete({ where: { id } });
    });
  }
}
