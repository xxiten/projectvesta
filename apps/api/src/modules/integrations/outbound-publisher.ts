import { Injectable, Logger } from '@nestjs/common';

/**
 * Outbound event publisher — STUB. The real implementation writes to the
 * transactional outbox in the same DB tx as the domain change; the worker
 * (apps/worker) relays it to connectors with idempotency + retry (ADR-0004,
 * Epic E7). Kept as a seam so call sites are stable.
 */
@Injectable()
export class OutboundPublisher {
  private readonly logger = new Logger(OutboundPublisher.name);

  async publish(tenantId: string, eventType: string, payload: unknown): Promise<void> {
    // PLACEHOLDER: no transactional outbox yet.
    this.logger.debug(
      `[outbound stub] tenant=${tenantId} event=${eventType} payload=${JSON.stringify(payload)}`,
    );
  }
}
