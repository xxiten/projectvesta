import {
  Global,
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_CONFIG, loadConfig } from './config';
import { PrismaService } from './prisma.service';
import { AUTH_PORT, DevHeaderAuthAdapter } from './auth-port';
import { HealthController } from './health.controller';
import { TenantContextMiddleware } from './tenant-context.middleware';

/**
 * Cross-cutting platform concerns: config, persistence, auth seam, request
 * context. Global so feature modules inject PrismaService/config without
 * re-importing.
 */
@Global()
@Module({
  controllers: [HealthController],
  providers: [
    { provide: APP_CONFIG, useFactory: () => loadConfig() },
    PrismaService,
    { provide: AUTH_PORT, useClass: DevHeaderAuthAdapter },
  ],
  exports: [APP_CONFIG, PrismaService, AUTH_PORT],
})
export class PlatformModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
