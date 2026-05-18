import { Injectable } from '@nestjs/common';
import type {
  CanonicalReservation,
  ConnectorHealth,
  InboundResult,
} from '@vesta/integration-contracts';
import type { VestaConnector } from './connector';

/**
 * Dummy Channel-Manager connector. Demonstrates the ACL mapping; a real adapter
 * would speak the provider's ARI/booking API and push availability/rates.
 */
@Injectable()
export class ChannelManagerDummyConnector implements VestaConnector {
  readonly connectorKey = 'channel-manager.dummy';
  readonly displayName = 'Channel Manager (Demo)';

  toCanonicalReservation(payload: unknown): CanonicalReservation {
    const p = (payload ?? {}) as Record<string, unknown>;
    return {
      externalId: String(p.bookingId ?? 'unknown'),
      source: this.connectorKey,
      status: 'confirmed',
      arrival: String(p.checkin ?? ''),
      departure: String(p.checkout ?? ''),
      roomTypeCode: String(p.roomCode ?? 'STD'),
      ratePlanCode: String(p.rateCode ?? 'BAR'),
      occupancy: { adults: Number(p.adults ?? 2), children: Number(p.children ?? 0) },
      totalAmount: { amountMinor: Number(p.amountMinor ?? 0), currency: 'EUR' },
      primaryGuest: {
        externalId: String(p.guestId ?? 'g-unknown'),
        firstName: String(p.firstName ?? 'Guest'),
        lastName: String(p.lastName ?? 'Channel'),
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
