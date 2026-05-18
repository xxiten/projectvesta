import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateConnectionDto {
  @ApiProperty({ example: 'booking-engine.dummy' })
  @IsString()
  @Length(2, 80)
  connectorKey!: string;
}
