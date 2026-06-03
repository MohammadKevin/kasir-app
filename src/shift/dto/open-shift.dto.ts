import {
  IsInt,
  IsString,
} from 'class-validator'

export class OpenShiftDto {
  @IsString()
  storeId!: string

  @IsString()
  userId!: string

  @IsInt()
  openingCash!: number
}