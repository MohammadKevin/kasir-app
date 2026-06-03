import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
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
}