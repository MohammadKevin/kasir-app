import { IsOptional, IsString } from 'class-validator';

export class CreateCartDto {
  @IsString()
  outletId!: string;

  @IsString()
  cashierId!: string;

  @IsOptional()
  @IsString()
  customerId?: string;
}