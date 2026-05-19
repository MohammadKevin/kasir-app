import {
  IsInt,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateReturnItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  subtotal!: number;
}