import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import type { CreatePropertyInput } from '@vesta/api-contracts';

export class CreatePropertyDto implements CreatePropertyInput {
  @ApiProperty({ example: 'Hotel Vesta Demo' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional({ example: 'Europe/Rome' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
