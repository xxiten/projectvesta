import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';
import type { CreateRoomInput } from '@vesta/api-contracts';

export class CreateRoomDto implements CreateRoomInput {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty({ example: '101' })
  @IsString()
  @Length(1, 16)
  number!: string;
}
