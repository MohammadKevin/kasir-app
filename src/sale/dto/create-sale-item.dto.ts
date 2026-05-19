// sale/dto/create-sale-item.dto.ts

import {
  IsInt,
  IsString,
  Min,
} from 'class-validator';

export class CreateSaleItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}