import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { TenantDto } from '@vesta/api-contracts';
import { Ctx } from '../../platform/current-context.decorator';
import type { RequestContext } from '../../platform/tenant-context';
import { TenantService } from './tenant.service';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenants: TenantService) {}

  @Get('me')
  @ApiOkResponse({ description: 'The tenant of the current request scope' })
  me(@Ctx() ctx: RequestContext): Promise<TenantDto> {
    return this.tenants.getById(ctx.tenantId);
  }
}
