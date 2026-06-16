import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

import {
  ExpenseCategory,
} from '@prisma/client'

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number

  @IsOptional()
  @IsEnum(
    ExpenseCategory,
  )
  category?: ExpenseCategory

  @IsOptional()
  @IsString()
  createdAt?: string
}