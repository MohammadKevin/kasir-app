import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator'

import { DiscountType } from '@prisma/client'

export class UpdateDiscountDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(DiscountType)
  type?: DiscountType

  @IsOptional()
  @IsInt()
  value?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  startDate?: Date

  @IsOptional()
  endDate?: Date
}