import {
  IsInt,
  Min,
} from 'class-validator'

import { Type } from 'class-transformer'

export class CloseShiftDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  closingCash!: number
}