import {
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  storeId!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string
}