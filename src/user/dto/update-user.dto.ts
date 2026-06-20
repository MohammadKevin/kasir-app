import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  pin?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
