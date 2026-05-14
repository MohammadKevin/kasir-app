import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { PaymentMethod } from '@prisma/client';

class SaleItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsNumber()
  quantity!: number;
}

export class CreateSaleDto {
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @IsOptional()
  @IsString()
  paymentProof?: string;

  @IsString()
  @IsNotEmpty()
  outletId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];
}
