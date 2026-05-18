import type {
  CanonicalAvailability,
  CanonicalRate,
  CanonicalReservation,
} from './canonical';

/**
 * Result of processing an inbound message. Connectors must be idempotent:
 * re-delivery of the same `dedupKey` must not produce duplicate effects.
 */
export interface InboundResult {
  status: 'processed' | 'duplicate' | 'rejected';
  dedupKey: string;
  message?: string;
}

export interface ConnectorHealth {
  connected: boolean;
  lastSyncAt?: string;
  errorRate24h: number;
  deadLetterDepth: number;
}

/** Receive external events (webhooks / polled pulls) into the canonical model. */
export interface InboundPort {
  readonly connectorKey: string;
  ingestReservation(payload: unknown, dedupKey: string): Promise<InboundResult>;
}

/** Push canonical state outward (availability / rates / inventory). */
export interface OutboundPort {
  readonly connectorKey: string;
  pushAvailability(items: CanonicalAvailability[]): Promise<void>;
  pushRates(items: CanonicalRate[]): Promise<void>;
}

export interface HealthPort {
  readonly connectorKey: string;
  health(): Promise<ConnectorHealth>;
}

/** Core-owned port the reservation module exposes to the integrations hub. */
export interface ReservationSink {
  applyExternalReservation(reservation: CanonicalReservation): Promise<void>;
}
