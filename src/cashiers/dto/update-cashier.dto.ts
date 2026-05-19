import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateCashierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  pin?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}