import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

export class CreateProductDto {
  @IsOptional()
  @IsUUID()
  storeId?: string

  @IsUUID()
  categoryId!: string

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