import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  price!: number;
}