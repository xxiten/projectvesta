import { Injectable } from '@nestjs/common';
import type {
  CanonicalReservation,
  ConnectorHealth,
  InboundResult,
} from '@vesta/integration-contracts';
import type { VestaConnector } from './connector';

/**
 * Dummy Booking-Engine connector (direct bookings from the hotel's own site).
 */
@Injectable()
export class BookingEngineDummyConnector implements VestaConnector {
  readonly connectorKey = 'booking-engine.dummy';
  readonly displayName = 'Booking Engine (Demo)';

  toCanonicalReservation(payload: unknown): CanonicalReservation {
    const p = (payload ?? {}) as Record<string, unknown>;
    return {
      externalId: String(p.ref ?? 'unknown'),
      source: this.connectorKey,
      status: 'confirmed',
      arrival: String(p.from ?? ''),
      departure: String(p.to ?? ''),
      roomTypeCode: String(p.roomType ?? 'STD'),
      ratePlanCode: String(p.ratePlan ?? 'BAR'),
      occupancy: { adults: Number(p.adults ?? 2), children: Number(p.children ?? 0) },
      totalAmount: { amountMinor: Number(p.totalMinor ?? 0), currency: 'EUR' },
      primaryGuest: {
        externalId: String(p.email ?? 'g-unknown'),
        firstName: String(p.firstName ?? 'Guest'),
        lastName: String(p.lastName ?? 'Web'),
        ...(p.email ? { email: String(p.email) } : {}),
      },
    };
  }

  async ingest(payload: unknown, dedupKey: string): Promise<InboundResult> {
    this.toCanonicalReservation(payload);
    return { status: 'processed', dedupKey };
  }

  async health(): Promise<ConnectorHealth> {
    return { connected: true, errorRate24h: 0, deadLetterDepth: 0 };
  }
}
