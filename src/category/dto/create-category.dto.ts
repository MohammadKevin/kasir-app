import { IsOptional, IsString, IsNotEmpty } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  categoryId?: string
}