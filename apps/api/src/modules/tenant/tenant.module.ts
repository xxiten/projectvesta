import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

/** Tenant & subscription/plan management (generic SaaS subdomain). */
@Module({
  controllers: [TenantController, DevController],
  providers: [TenantService],
})
export class TenantModule {}
