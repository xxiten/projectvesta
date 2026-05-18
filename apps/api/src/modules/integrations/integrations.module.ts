import { Module } from '@nestjs/common';
import { ConnectorRegistry } from './connector-registry';
import { BookingEngineDummyConnector } from './connectors/booking-engine.dummy';
import { ChannelManagerDummyConnector } from './connectors/channel-manager.dummy';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { OutboundPublisher } from './outbound-publisher';

/**
 * STRATEGIC: integrations hub. Anti-corruption layer between the core and
 * external systems (channel manager, booking engine, payment). The core never
 * imports this module — it depends on ports in @vesta/integration-contracts.
 */
@Module({
  controllers: [IntegrationsController],
  providers: [
    ChannelManagerDummyConnector,
    BookingEngineDummyConnector,
    ConnectorRegistry,
    IntegrationsService,
    OutboundPublisher,
  ],
  exports: [OutboundPublisher],
})
export class IntegrationsModule {}
