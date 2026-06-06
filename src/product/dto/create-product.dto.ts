import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator'

export class CreateProductDto {
  @IsUUID()
  storeId!: string

  @IsUUID()
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
  @Min(0)
  costPrice!: number

  @IsInt()
  @Min(0)
  sellingPrice!: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumStock?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}