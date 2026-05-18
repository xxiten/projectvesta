import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateReservationInput,
  ReservationDto,
  StayMutationResultDto,
} from '@vesta/api-contracts';
import { PrismaService } from '../../platform/prisma.service';
import { withTenant } from '../../platform/rls';
import { canTransition, computeNights, computeTotalMinor } from './domain/status';
import type { StayAssignmentPort } from './reservation.public';

type ReservationRow = {
  id: string;
  status: ReservationDto['status'];
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  arrival: Date;
  departure: Date;
  adults: number;
  children: number;
  totalAmountMinor: number;
  currency: string;
  source: string;
  createdAt: Date;
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    countryCode: string | null;
  };
};

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
const toUtcDate = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

/** The GiST exclusion constraint (stay_room_no_overlap) surfaces as a raw
 *  Postgres 23P01 — Prisma has no typed code for it, so match by name. */
function isRoomOverlap(e: unknown): boolean {
  const msg = String((e as { message?: string })?.message ?? e);
  return msg.includes('stay_room_no_overlap') || msg.includes('23P01');
}

type StayWithReservation = {
  id: string;
  roomId: string | null;
  checkIn: Date;
  checkOut: Date;
  reservation: { id: string; status: ReservationDto['status'] };
};

function toStayResult(s: StayWithReservation): StayMutationResultDto {
  return {
    stayId: s.id,
    reservationId: s.reservation.id,
    roomId: s.roomId,
    checkIn: isoDate(s.checkIn),
    checkOut: isoDate(s.checkOut),
    reservationStatus: s.reservation.status,
  };
}

function toDto(r: ReservationRow): ReservationDto {
  return {
    id: r.id,
    status: r.status,
    propertyId: r.propertyId,
    roomTypeId: r.roomTypeId,
    ratePlanId: r.ratePlanId,
    arrival: isoDate(r.arrival),
    departure: isoDate(r.departure),
    adults: r.adults,
    children: r.children,
    totalAmountMinor: r.totalAmountMinor,
    currency: r.currency,
    source: r.source,
    createdAt: r.createdAt.toISOString(),
    guest: {
      id: r.guest.id,
      firstName: r.guest.firstName,
      lastName: r.guest.lastName,
      ...(r.guest.email ? { email: r.guest.email } : {}),
      ...(r.guest.phone ? { phone: r.guest.phone } : {}),
      ...(r.guest.countryCode ? { countryCode: r.guest.countryCode } : {}),
    },
  };
}

@Injectable()
export class ReservationService implements StayAssignmentPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, input: CreateReservationInput): Promise<ReservationDto> {
    let nights: number;
    try {
      nights = computeNights(input.arrival, input.departure);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    const arrival = new Date(`${input.arrival}T00:00:00.000Z`);
    const departure = new Date(`${input.departure}T00:00:00.000Z`);

    return withTenant(this.prisma, tenantId, async (tx) => {
      const roomType = await tx.roomType.findUnique({ where: { id: input.roomTypeId } });
      if (!roomType || roomType.propertyId !== input.propertyId) {
        throw new NotFoundException('Room type not found for this property');
      }
      const ratePlan = await tx.ratePlan.findUnique({ where: { id: input.ratePlanId } });
      if (!ratePlan || ratePlan.propertyId !== input.propertyId) {
        throw new NotFoundException('Rate plan not found for this property');
      }

      // Placeholder availability guard — a real inventory engine (atomic holds,
      // overbooking limits, channel concurrency) is Epic E1/E2.
      const overlapping = await tx.reservation.count({
        where: {
          roomTypeId: input.roomTypeId,
          status: { in: ['enquiry', 'confirmed', 'checked_in'] },
          arrival: { lt: departure },
          departure: { gt: arrival },
        },
      });
      if (overlapping >= roomType.totalUnits) {
        throw new ConflictException('No availability for the selected room type and dates');
      }

      const created = await tx.reservation.create({
        // Fully "checked" create input: relations via connect, nested writes
        // for guest/stay. (tenantId is a plain scalar by schema convention.)
        data: {
          tenantId,
          status: 'confirmed',
          arrival,
          departure,
          adults: input.adults,
          children: input.children ?? 0,
          totalAmountMinor: computeTotalMinor(ratePlan.baseAmountMinor, nights),
          currency: ratePlan.currency,
          source: 'direct',
          ...(input.notes ? { notes: input.notes } : {}),
          property: { connect: { id: input.propertyId } },
          roomType: { connect: { id: input.roomTypeId } },
          ratePlan: { connect: { id: input.ratePlanId } },
          guest: {
            create: {
              tenantId,
              firstName: input.guest.firstName,
              lastName: input.guest.lastName,
              ...(input.guest.email ? { email: input.guest.email } : {}),
              ...(input.guest.phone ? { phone: input.guest.phone } : {}),
              ...(input.guest.countryCode ? { countryCode: input.guest.countryCode } : {}),
            },
          },
          stays: {
            create: {
              tenantId,
              roomType: { connect: { id: input.roomTypeId } },
              checkIn: arrival,
              checkOut: departure,
            },
          },
        },
        include: { guest: true },
      });
      return toDto(created as unknown as ReservationRow);
    });
  }

  list(tenantId: string): Promise<ReservationDto[]> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const rows = await tx.reservation.findMany({
        include: { guest: true },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((r) => toDto(r as unknown as ReservationRow));
    });
  }

  getById(tenantId: string, id: string): Promise<ReservationDto> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const r = await tx.reservation.findUnique({
        where: { id },
        include: { guest: true },
      });
      if (!r) throw new NotFoundException('Reservation not found');
      return toDto(r as unknown as ReservationRow);
    });
  }

  // ── StayAssignmentPort (orchestrated by front-desk via the public port) ──

  async assignRoom(
    tenantId: string,
    stayId: string,
    roomId: string | null,
  ): Promise<StayMutationResultDto> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const stay = await tx.stay.findUnique({ where: { id: stayId } });
      if (!stay) throw new NotFoundException('Stay not found');

      if (roomId) {
        const room = await tx.room.findUnique({ where: { id: roomId } });
        // RLS already scopes to the tenant; just confirm same property.
        if (!room || room.propertyId !== (await this.propertyOfStay(tx, stay.reservationId))) {
          throw new NotFoundException('Room not found for this property');
        }
      }

      try {
        await tx.stay.update({ where: { id: stayId }, data: { roomId } });
      } catch (e) {
        if (isRoomOverlap(e)) {
          throw new ConflictException('Room is already occupied for these dates');
        }
        throw e;
      }
      return toStayResult(await this.loadStay(tx, stayId));
    });
  }

  async resizeStay(
    tenantId: string,
    stayId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<StayMutationResultDto> {
    try {
      computeNights(checkIn, checkOut);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    return withTenant(this.prisma, tenantId, async (tx) => {
      const stay = await tx.stay.findUnique({ where: { id: stayId } });
      if (!stay) throw new NotFoundException('Stay not found');

      try {
        await tx.stay.update({
          where: { id: stayId },
          data: { checkIn: toUtcDate(checkIn), checkOut: toUtcDate(checkOut) },
        });
      } catch (e) {
        if (isRoomOverlap(e)) {
          throw new ConflictException('Room is already occupied for these dates');
        }
        throw e;
      }

      // Keep the reservation envelope in sync with its stays.
      const stays = await tx.stay.findMany({ where: { reservationId: stay.reservationId } });
      const arrival = new Date(Math.min(...stays.map((s) => s.checkIn.getTime())));
      const departure = new Date(Math.max(...stays.map((s) => s.checkOut.getTime())));
      await tx.reservation.update({
        where: { id: stay.reservationId },
        data: { arrival, departure },
      });

      return toStayResult(await this.loadStay(tx, stayId));
    });
  }

  checkIn(tenantId: string, reservationId: string, stayId: string): Promise<StayMutationResultDto> {
    return this.transition(tenantId, reservationId, stayId, 'checked_in');
  }

  checkOut(
    tenantId: string,
    reservationId: string,
    stayId: string,
  ): Promise<StayMutationResultDto> {
    return this.transition(tenantId, reservationId, stayId, 'checked_out');
  }

  private transition(
    tenantId: string,
    reservationId: string,
    stayId: string,
    to: 'checked_in' | 'checked_out',
  ): Promise<StayMutationResultDto> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
      if (!reservation) throw new NotFoundException('Reservation not found');
      const stay = await tx.stay.findUnique({ where: { id: stayId } });
      if (!stay || stay.reservationId !== reservationId) {
        throw new NotFoundException('Stay not found for this reservation');
      }
      if (!canTransition(reservation.status, to)) {
        throw new ConflictException(`Cannot move reservation from ${reservation.status} to ${to}`);
      }
      if (to === 'checked_in' && !stay.roomId) {
        throw new ConflictException('Assign a room before check-in');
      }
      await tx.reservation.update({ where: { id: reservationId }, data: { status: to } });
      return toStayResult(await this.loadStay(tx, stayId));
    });
  }

  private async loadStay(
    tx: Parameters<Parameters<typeof withTenant>[2]>[0],
    stayId: string,
  ): Promise<StayWithReservation> {
    const s = await tx.stay.findUnique({
      where: { id: stayId },
      include: { reservation: { select: { id: true, status: true } } },
    });
    if (!s) throw new NotFoundException('Stay not found');
    return s as unknown as StayWithReservation;
  }

  private async propertyOfStay(
    tx: Parameters<Parameters<typeof withTenant>[2]>[0],
    reservationId: string,
  ): Promise<string> {
    const r = await tx.reservation.findUnique({
      where: { id: reservationId },
      select: { propertyId: true },
    });
    if (!r) throw new NotFoundException('Reservation not found');
    return r.propertyId;
  }
}
