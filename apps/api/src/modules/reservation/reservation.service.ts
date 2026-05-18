import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateReservationInput, ReservationDto } from '@vesta/api-contracts';
import { PrismaService } from '../../platform/prisma.service';
import { withTenant } from '../../platform/rls';
import { computeNights, computeTotalMinor } from './domain/status';

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
export class ReservationService {
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
}
