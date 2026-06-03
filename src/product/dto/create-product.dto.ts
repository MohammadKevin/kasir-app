import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateProductDto {
  @IsString()
  storeId!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  image?: string

  @IsOptional()
  @IsString()
  sku?: string

  @IsOptional()
  @IsString()
  barcode?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsInt()
  costPrice!: number

  @IsInt()
  sellingPrice!: number

  @IsOptional()
  @IsInt()
  stock?: number

  @IsOptional()
  @IsInt()
  minimumStock?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}