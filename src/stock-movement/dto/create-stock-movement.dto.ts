import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateStockMovementDto {
  @IsString()
  storeId!: string

  @IsString()
  productId!: string

  @IsString()
  type!: string

  @IsInt()
  qty!: number

  @IsOptional()
  @IsString()
  note?: string
}