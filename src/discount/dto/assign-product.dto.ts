import { IsString } from 'class-validator';

export class AssignProductDto {
  @IsString()
  productId!: string;
}
