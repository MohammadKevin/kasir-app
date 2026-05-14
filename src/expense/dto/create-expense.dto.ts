import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { ExpenseType } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ExpenseType)
  type!: ExpenseType;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  outletId!: string;
}
