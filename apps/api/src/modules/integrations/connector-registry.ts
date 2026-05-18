import { Injectable } from '@nestjs/common';
import { BookingEngineDummyConnector } from './connectors/booking-engine.dummy';
import { ChannelManagerDummyConnector } from './connectors/channel-manager.dummy';
import type { VestaConnector } from './connectors/connector';

/** In-process registry of available connectors (real ones added per Epic E7). */
@Injectable()
export class ConnectorRegistry {
  private readonly connectors = new Map<string, VestaConnector>();

  constructor(
    channelManager: ChannelManagerDummyConnector,
    bookingEngine: BookingEngineDummyConnector,
  ) {
    for (const c of [channelManager, bookingEngine]) {
      this.connectors.set(c.connectorKey, c);
    }
  }

  list(): { key: string; displayName: string }[] {
    return [...this.connectors.values()].map((c) => ({
      key: c.connectorKey,
      displayName: c.displayName,
    }));
  }

  get(key: string): VestaConnector | undefined {
    return this.connectors.get(key);
  }
}
