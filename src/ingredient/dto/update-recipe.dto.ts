import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class RecipeItemDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string

  @IsNumber()
  quantity: number
}

export class UpdateRecipeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[]
}
