import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsInt()
  @Min(0)
  minStock!: number;

  @IsNumber()
  costPrice!: number;

  @IsNumber()
  sellingPrice!: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsString()
  @IsNotEmpty()
  outletId!: string;
}
