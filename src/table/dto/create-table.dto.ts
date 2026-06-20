import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;
}
