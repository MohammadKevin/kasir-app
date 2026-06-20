import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

import { DiscountType } from '@prisma/client';

export class CreateDiscountDto {
  @IsString()
  storeId!: string;

  @IsString()
  name!: string;

  @IsEnum(DiscountType)
  type!: DiscountType;

  @IsInt()
  value!: number;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;
}
