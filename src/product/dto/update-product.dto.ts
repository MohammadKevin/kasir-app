import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator'

export class UpdateProductDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @IsOptional()
  @IsString()
  name?: string

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

  @IsOptional()
  @IsInt()
  @Min(0)
  costPrice?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  sellingPrice?: number

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