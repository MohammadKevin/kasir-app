import {
  IsInt,
  IsString,
  Min,
} from 'class-validator'

export class PurchaseItemDto {
  @IsString()
  productId!: string

  @IsInt()
  @Min(1)
  quantity!: number

  @IsInt()
  @Min(0)
  costPrice!: number
}