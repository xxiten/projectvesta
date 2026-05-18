import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { PlatformModule } from './platform/platform.module';
import { TenantModule } from './modules/tenant';
import { IdentityAccessModule } from './modules/identity-access';
import { PropertySetupModule } from './modules/property-setup';
import { InventoryModule } from './modules/inventory';
import { RatePricingModule } from './modules/rate-pricing';
import { ReservationModule } from './modules/reservation';
import { GuestModule } from './modules/guest';
import { FrontDeskModule } from './modules/front-desk';
import { HousekeepingModule } from './modules/housekeeping';
import { BillingModule } from './modules/billing';
import { DocumentsModule } from './modules/documents';
import { IntegrationsModule } from './modules/integrations';
import { ComplianceModule } from './modules/compliance';
import { ReportingModule } from './modules/reporting';
import { NotificationsModule } from './modules/notifications';

/**
 * Composition root of the modular monolith. Modules are wired here only;
 * cross-module access goes through public surfaces or domain events, never
 * deep imports (enforced by .dependency-cruiser.cjs).
 */
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        ...(process.env.NODE_ENV === 'production'
          ? {}
          : { transport: { target: 'pino-pretty', options: { singleLine: true } } }),
      },
    }),
    PlatformModule,
    TenantModule,
    IdentityAccessModule,
    PropertySetupModule,
    InventoryModule,
    RatePricingModule,
    ReservationModule,
    GuestModule,
    FrontDeskModule,
    HousekeepingModule,
    BillingModule,
    DocumentsModule,
    IntegrationsModule,
    ComplianceModule,
    ReportingModule,
    NotificationsModule,
  ],
})
export class AppModule {}
