import { IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  storeId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
