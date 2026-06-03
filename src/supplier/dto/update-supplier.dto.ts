import {
  IsOptional,
  IsString,
} from 'class-validator'

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  phone?: string
}