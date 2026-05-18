import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { PropertyDto, RatePlanDto, RoomDto, RoomTypeDto } from '@vesta/api-contracts';
import { Ctx } from '../../platform/current-context.decorator';
import type { RequestContext } from '../../platform/tenant-context';
import { CreatePropertyDto } from './dto/create-property.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateHousekeepingDto } from './dto/update-housekeeping.dto';
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

  @Get(':id/rooms')
  @ApiOkResponse({ description: 'Physical rooms of the property' })
  rooms(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string): Promise<RoomDto[]> {
    return this.properties.listRooms(ctx.tenantId, id);
  }

  @Post(':id/rooms')
  @ApiCreatedResponse({ description: 'Created room' })
  createRoom(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRoomDto,
  ): Promise<RoomDto> {
    return this.properties.createRoom(ctx.tenantId, id, dto);
  }
}

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly properties: PropertyService) {}

  @Patch(':id/housekeeping')
  @ApiOkResponse({ description: 'Updated housekeeping status' })
  setHousekeeping(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHousekeepingDto,
  ): Promise<RoomDto> {
    return this.properties.setHousekeeping(ctx.tenantId, id, dto.status);
  }
}
