import type {
  CanonicalReservation,
  ConnectorHealth,
  InboundResult,
} from '@vesta/integration-contracts';

/**
 * A Vesta connector = anti-corruption adapter for one external system. It maps
 * provider payloads onto the Canonical Data Model and is idempotent on
 * `dedupKey`. Real adapters add OutboundPort (ARI push) + versioning later.
 */
export interface VestaConnector {
  readonly connectorKey: string;
  readonly displayName: string;
  /** Translate a raw external payload into the canonical model. */
  toCanonicalReservation(payload: unknown): CanonicalReservation;
  ingest(payload: unknown, dedupKey: string): Promise<InboundResult>;
  health(): Promise<ConnectorHealth>;
}
