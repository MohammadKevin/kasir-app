import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOutletDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  noTelp?: string;

  @IsOptional()
  @IsString()
  qrisImage?: string;
}
