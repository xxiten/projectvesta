import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ReservationDto } from '@vesta/api-contracts';
import { Ctx } from '../../platform/current-context.decorator';
import type { RequestContext } from '../../platform/tenant-context';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationService } from './reservation.service';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservations: ReservationService) {}

  @Get()
  @ApiOkResponse({ description: 'Reservations of the current tenant' })
  list(@Ctx() ctx: RequestContext): Promise<ReservationDto[]> {
    return this.reservations.list(ctx.tenantId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Created reservation' })
  create(@Ctx() ctx: RequestContext, @Body() dto: CreateReservationDto): Promise<ReservationDto> {
    return this.reservations.create(ctx.tenantId, dto);
  }

  @Get(':id')
  get(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string): Promise<ReservationDto> {
    return this.reservations.getById(ctx.tenantId, id);
  }
}
