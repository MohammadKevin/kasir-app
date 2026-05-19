import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCashierDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  pin?: string;

  @IsString()
  outletId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}