import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

import { Type } from "class-transformer";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sellingPrice?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  outletId?: string;
}