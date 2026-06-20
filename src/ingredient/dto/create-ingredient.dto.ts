import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  stock: number;

  @IsString()
  @IsNotEmpty()
  unit: string;
}
