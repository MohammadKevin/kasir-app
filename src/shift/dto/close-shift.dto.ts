import {
  IsInt,
} from 'class-validator'

export class CloseShiftDto {
  @IsInt()
  closingCash!: number
}