import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
} from 'class-validator'

export class CreateCashierDto {
  @IsString()
  storeId!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsString()
  @Length(4, 6)
  pin!: string

  @IsOptional()
  @IsBoolean()
  isStoreAdmin?: boolean
}