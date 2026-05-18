import { Controller, Get, Inject, NotFoundException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { APP_CONFIG, type AppConfig } from '../../platform/config';
import { PrismaService } from '../../platform/prisma.service';
import { withTenant } from '../../platform/rls';

/**
 * DEV-ONLY bootstrap for the placeholder login (plan decision 7). Returns the
 * seeded tenant + an admin user so the frontend can establish a request scope
 * with one click. Hard 404 in production.
 */
@ApiExcludeController()
@Controller('dev')
export class DevController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get('context')
  async context(): Promise<{
    tenantId: string;
    tenantName: string;
    userId: string;
    email: string;
  }> {
    if (this.config.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    const tenant = await this.prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!tenant)
      throw new NotFoundException('No tenant seeded — run pnpm --filter @vesta/api db:seed');

    return withTenant(this.prisma, tenant.id, async (tx) => {
      const user = await tx.appUser.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!user) throw new NotFoundException('No user seeded');
      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        userId: user.id,
        email: user.email,
      };
    });
  }
}
