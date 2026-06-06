import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
} from 'class-validator'

export class CreateProductDto {
  @IsUUID()
  @IsNotEmpty()
  storeId!: string

  @IsUUID()
  @IsNotEmpty()
  categoryId!: string

  @IsString()
  @IsNotEmpty()
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