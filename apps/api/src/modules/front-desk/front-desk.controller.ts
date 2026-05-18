import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { StayMutationResultDto } from '@vesta/api-contracts';
import { Ctx } from '../../platform/current-context.decorator';
import type { RequestContext } from '../../platform/tenant-context';
import { STAY_ASSIGNMENT_PORT, type StayAssignmentPort } from '../reservation';
import { AssignStayDto, ResizeStayDto, StayRefDto } from './dto/front-desk.dto';
import { RoomRackService } from './room-rack.service';

/**
 * Front-desk operations on the rack. Stay/Reservation mutations are delegated
 * to the reservation aggregate via its public port (no deep import); blocking
 * lives here because it is a front-desk concern over physical inventory.
 */
@ApiTags('front-desk')
@Controller()
export class FrontDeskController {
  constructor(
    @Inject(STAY_ASSIGNMENT_PORT) private readonly stays: StayAssignmentPort,
    private readonly rack: RoomRackService,
  ) {}

  @Patch('stays/:id/assignment')
  @ApiOkResponse({ description: 'Assigned / moved / unassigned a stay' })
  assign(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignStayDto,
  ): Promise<StayMutationResultDto> {
    return this.stays.assignRoom(ctx.tenantId, id, dto.roomId ?? null);
  }

  @Patch('stays/:id')
  @ApiOkResponse({ description: 'Resized a stay (extend / shorten)' })
  resize(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResizeStayDto,
  ): Promise<StayMutationResultDto> {
    return this.stays.resizeStay(ctx.tenantId, id, dto.checkIn, dto.checkOut);
  }

  @Post('reservations/:id/check-in')
  @ApiOkResponse({ description: 'Checked the reservation in' })
  checkIn(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StayRefDto,
  ): Promise<StayMutationResultDto> {
    return this.stays.checkIn(ctx.tenantId, id, dto.stayId);
  }

  @Post('reservations/:id/check-out')
  @ApiOkResponse({ description: 'Checked the reservation out' })
  checkOut(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StayRefDto,
  ): Promise<StayMutationResultDto> {
    return this.stays.checkOut(ctx.tenantId, id, dto.stayId);
  }

  @Delete('room-blocks/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Deleted a room block' })
  deleteBlock(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.rack.deleteBlock(ctx.tenantId, id);
  }
}
