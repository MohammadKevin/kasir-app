import {
  IsInt,
  IsString,
  Min,
} from 'class-validator'

import { Type } from 'class-transformer'

export class OpenShiftDto {
  @IsString()
  storeId!: string

  @IsString()
  userId!: string

  @Type(() => Number)
  @IsInt()
  @Min(0)
  openingCash!: number
}