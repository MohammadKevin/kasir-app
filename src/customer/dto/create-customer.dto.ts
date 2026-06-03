import {
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateCustomerDto {
  @IsString()
  storeId!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  phone?: string
}