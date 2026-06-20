import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateIngredientDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}
