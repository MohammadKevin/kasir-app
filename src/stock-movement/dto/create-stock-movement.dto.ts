import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  DAMAGED = 'DAMAGED',
}

export class CreateStockMovementDto {
  @IsString()
  storeId!: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @IsInt()
  @Min(1)
  qty!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
