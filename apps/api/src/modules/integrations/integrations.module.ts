import { Module } from '@nestjs/common';

/**
 * STRATEGIC: integrations hub. Anti-corruption layer between the core and
 * external systems (channel manager, booking engine, payment). The core never
 * imports this module — it depends on ports in @vesta/integration-contracts.
 */
@Module({})
export class IntegrationsModule {}
