import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  name!: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal terdiri dari 6 karakter' })
  password!: string;
}
