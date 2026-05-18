import { randomUUID } from 'node:crypto';

/**
 * Base shape for domain events. Integration-relevant events are persisted via
 * the transactional outbox (see docs/adr/0004); in-process subscribers consume
 * the same event objects synchronously.
 */
export interface DomainEvent<TPayload = unknown> {
  readonly eventId: string;
  readonly type: string;
  readonly tenantId: string;
  readonly occurredAt: string;
  readonly payload: TPayload;
}

export function createDomainEvent<TPayload>(
  type: string,
  tenantId: string,
  payload: TPayload,
): DomainEvent<TPayload> {
  return {
    eventId: randomUUID(),
    type,
    tenantId,
    occurredAt: new Date().toISOString(),
    payload,
  };
}
