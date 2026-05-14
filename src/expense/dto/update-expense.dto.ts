import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { ExpenseType } from '@prisma/client';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ExpenseType)
  type?: ExpenseType;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
