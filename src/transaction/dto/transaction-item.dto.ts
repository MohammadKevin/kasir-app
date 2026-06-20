import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TransactionItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsInt()
  cashierDiscount?: number;
}
