import { IsString, Length } from 'class-validator';

export class VerifyAdminPinDto {
  @IsString()
  storeId!: string;

  @IsString()
  @Length(4, 6)
  pin!: string;
}
