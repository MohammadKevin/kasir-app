import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CreateStoreDto {
  @IsString()
  name!: string

  @IsEmail()
  email!: string

  @MinLength(6)
  password!: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  logo?: string
}