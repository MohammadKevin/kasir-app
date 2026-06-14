import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsNumber,
} from 'class-validator'

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @MinLength(6)
  password?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  logo?: string

  @IsOptional()
  isActive?: boolean

  @IsOptional()
  @IsString()
  receiptHeader?: string

  @IsOptional()
  @IsString()
  receiptFooter?: string

  @IsOptional()
  @IsBoolean()
  receiptShowBarcode?: boolean

  @IsOptional()
  @IsBoolean()
  receiptShowCustomer?: boolean

  @IsOptional()
  @IsString()
  receiptSize?: string

  @IsOptional()
  @IsNumber()
  taxRate?: number

  @IsOptional()
  @IsNumber()
  serviceRate?: number

  @IsOptional()
  @IsBoolean()
  pointsEnabled?: boolean

  @IsOptional()
  @IsNumber()
  pointValue?: number
}