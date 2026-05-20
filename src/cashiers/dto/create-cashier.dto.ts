import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCashierDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  pin!: string;

  @IsString()
  @IsNotEmpty()
  outletId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}