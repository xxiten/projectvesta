import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import type {
  AssignStayInput,
  CreateRoomBlockInput,
  ResizeStayInput,
  RoomBlockReason,
} from '@vesta/api-contracts';

const BLOCK_REASONS: RoomBlockReason[] = ['maintenance', 'out_of_order', 'hold'];

export class AssignStayDto implements AssignStayInput {
  @ApiProperty({ format: 'uuid', nullable: true, description: 'null = move back to the rail' })
  @IsOptional()
  @IsUUID()
  roomId!: string | null;
}

export class ResizeStayDto implements ResizeStayInput {
  @ApiProperty({ example: '2026-06-12' })
  @IsDateString()
  checkIn!: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  checkOut!: string;
}

export class StayRefDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  stayId!: string;
}

export class CreateRoomBlockDto implements CreateRoomBlockInput {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  roomId!: string;

  @ApiProperty({ example: '2026-06-20' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-06-23' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ enum: BLOCK_REASONS })
  @IsIn(BLOCK_REASONS)
  reason!: RoomBlockReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
