import {
  IsEnum,
  IsInt,
  IsString,
  Min,
} from 'class-validator'

import {
  ExpenseCategory,
} from '@prisma/client'

export class CreateExpenseDto {
  @IsString()
  storeId!: string

  @IsString()
  title!: string

  @IsInt()
  @Min(1)
  amount!: number

  @IsEnum(
    ExpenseCategory,
  )
  category!: ExpenseCategory
}