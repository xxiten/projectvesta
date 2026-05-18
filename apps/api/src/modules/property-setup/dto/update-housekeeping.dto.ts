import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { RoomHousekeepingStatus, UpdateHousekeepingInput } from '@vesta/api-contracts';

const STATUSES: RoomHousekeepingStatus[] = ['clean', 'dirty', 'inspected', 'out_of_order'];

export class UpdateHousekeepingDto implements UpdateHousekeepingInput {
  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  status!: RoomHousekeepingStatus;
}
