import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { RoomBlockDto, RoomRackDto } from '@vesta/api-contracts';
import { Ctx } from '../../platform/current-context.decorator';
import type { RequestContext } from '../../platform/tenant-context';
import { CreateRoomBlockDto } from './dto/front-desk.dto';
import { RoomRackService } from './room-rack.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

@ApiTags('room-rack')
@Controller('properties')
export class RoomRackController {
  constructor(private readonly rack: RoomRackService) {}

  @Get(':id/room-rack')
  @ApiQuery({ name: 'from', example: '2026-06-01' })
  @ApiQuery({ name: 'to', example: '2026-06-15' })
  @ApiOkResponse({ description: 'Occupancy rack for the window [from,to)' })
  getRack(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<RoomRackDto> {
    if (!ISO_DATE.test(from ?? '') || !ISO_DATE.test(to ?? '')) {
      throw new BadRequestException('`from` and `to` must be YYYY-MM-DD');
    }
    return this.rack.getRack(ctx.tenantId, id, from, to);
  }

  @Post(':id/room-blocks')
  @ApiCreatedResponse({ description: 'Created room block' })
  createBlock(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRoomBlockDto,
  ): Promise<RoomBlockDto> {
    return this.rack.createBlock(ctx.tenantId, id, dto);
  }
}
