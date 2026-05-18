import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type { CreateReservationInput, GuestInput } from '@vesta/api-contracts';

class GuestInputDto implements GuestInput {
  @ApiProperty({ example: 'Maria' })
  @IsString()
  @Length(1, 80)
  firstName!: string;

  @ApiProperty({ example: 'Gruber' })
  @IsString()
  @Length(1, 80)
  lastName!: string;

  @ApiPropertyOptional({ example: 'gast@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'IT' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}

export class CreateReservationDto implements CreateReservationInput {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  propertyId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ratePlanId!: string;

  @ApiProperty({ example: '2026-06-12' })
  @IsDateString()
  arrival!: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  departure!: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  adults!: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(12)
  children?: number;

  @ApiProperty({ type: GuestInputDto })
  @ValidateNested()
  @Type(() => GuestInputDto)
  guest!: GuestInputDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
