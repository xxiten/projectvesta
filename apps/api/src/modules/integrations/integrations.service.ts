import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { CanonicalReservation, InboundResult } from '@vesta/integration-contracts';
import { PrismaService } from '../../platform/prisma.service';
import { withTenant } from '../../platform/rls';
import { ConnectorRegistry } from './connector-registry';

export interface ConnectionDto {
  id: string;
  connectorKey: string;
  displayName: string;
  status: string;
}

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ConnectorRegistry,
  ) {}

  listConnectors(): { key: string; displayName: string }[] {
    return this.registry.list();
  }

  listConnections(tenantId: string): Promise<ConnectionDto[]> {
    return withTenant(this.prisma, tenantId, async (tx) => {
      const rows = await tx.integrationConnection.findMany({
        orderBy: { createdAt: 'asc' },
      });
      return rows.map((c) => ({
        id: c.id,
        connectorKey: c.connectorKey,
        displayName: c.displayName,
        status: c.status,
      }));
    });
  }

  createConnection(tenantId: string, connectorKey: string): Promise<ConnectionDto> {
    const connector = this.registry.get(connectorKey);
    if (!connector) {
      throw new BadRequestException(`Unknown connector "${connectorKey}"`);
    }
    return withTenant(this.prisma, tenantId, async (tx) => {
      const c = await tx.integrationConnection.upsert({
        where: { tenantId_connectorKey: { tenantId, connectorKey } },
        update: { status: 'connected' },
        create: {
          tenantId,
          connectorKey,
          displayName: connector.displayName,
          status: 'connected',
        },
      });
      return {
        id: c.id,
        connectorKey: c.connectorKey,
        displayName: c.displayName,
        status: c.status,
      };
    });
  }

  /**
   * Inbound webhook entry: idempotent via integration_inbox (dedupKey). The
   * canonical reservation is returned but intentionally NOT applied to the core
   * here — the seam is the ReservationSink port (integration-contracts); the
   * core must not depend on this module (ADR-0007). Wiring lands in Epic E7.
   */
  handleWebhook(
    tenantId: string,
    connectorKey: string,
    payload: unknown,
    dedupKeyHeader?: string,
  ): Promise<InboundResult & { canonical?: CanonicalReservation }> {
    const connector = this.registry.get(connectorKey);
    if (!connector) throw new NotFoundException(`Unknown connector "${connectorKey}"`);

    const dedupKey =
      dedupKeyHeader ??
      createHash('sha256')
        .update(JSON.stringify(payload ?? {}))
        .digest('hex');

    return withTenant(this.prisma, tenantId, async (tx) => {
      const connection = await tx.integrationConnection.findUnique({
        where: { tenantId_connectorKey: { tenantId, connectorKey } },
      });
      if (!connection) {
        throw new NotFoundException(`Connector "${connectorKey}" is not connected`);
      }

      try {
        await tx.integrationInbox.create({
          data: {
            tenantId,
            connectionId: connection.id,
            dedupKey,
            payload: payload as Prisma.InputJsonValue,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          return { status: 'duplicate', dedupKey };
        }
        throw e;
      }

      const canonical = connector.toCanonicalReservation(payload);
      const result = await connector.ingest(payload, dedupKey);
      return { ...result, canonical };
    });
  }
}
