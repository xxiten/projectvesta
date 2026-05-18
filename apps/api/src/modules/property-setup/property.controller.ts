import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { PropertyDto, RatePlanDto, RoomTypeDto } from '@vesta/api-contracts';
import { Ctx } from '../../platform/current-context.decorator';
import type { RequestContext } from '../../platform/tenant-context';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyService } from './property.service';

@ApiTags('properties')
@Controller('properties')
export class PropertyController {
  constructor(private readonly properties: PropertyService) {}

  @Get()
  @ApiOkResponse({ description: 'Properties of the current tenant' })
  list(@Ctx() ctx: RequestContext): Promise<PropertyDto[]> {
    return this.properties.list(ctx.tenantId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Created property' })
  create(@Ctx() ctx: RequestContext, @Body() dto: CreatePropertyDto): Promise<PropertyDto> {
    return this.properties.create(ctx.tenantId, dto);
  }

  @Get(':id')
  get(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string): Promise<PropertyDto> {
    return this.properties.getById(ctx.tenantId, id);
  }

  @Get(':id/room-types')
  roomTypes(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomTypeDto[]> {
    return this.properties.listRoomTypes(ctx.tenantId, id);
  }

  @Get(':id/rate-plans')
  ratePlans(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RatePlanDto[]> {
    return this.properties.listRatePlans(ctx.tenantId, id);
  }
}
