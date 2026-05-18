import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Ctx } from '../../platform/current-context.decorator';
import type { RequestContext } from '../../platform/tenant-context';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @ApiOkResponse({ description: 'Available connectors and configured connections' })
  async overview(@Ctx() ctx: RequestContext) {
    return {
      connectors: this.integrations.listConnectors(),
      connections: await this.integrations.listConnections(ctx.tenantId),
    };
  }

  @Post('connections')
  createConnection(@Ctx() ctx: RequestContext, @Body() dto: CreateConnectionDto) {
    return this.integrations.createConnection(ctx.tenantId, dto.connectorKey);
  }

  @Post('webhooks/:connectorKey')
  @ApiOkResponse({ description: 'Idempotent inbound webhook entry (skeleton)' })
  webhook(
    @Ctx() ctx: RequestContext,
    @Param('connectorKey') connectorKey: string,
    @Body() payload: unknown,
    @Headers('x-dedup-key') dedupKey?: string,
  ) {
    return this.integrations.handleWebhook(ctx.tenantId, connectorKey, payload, dedupKey);
  }
}
