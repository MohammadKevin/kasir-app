import {
  IsString,
  Length,
} from 'class-validator'

export class LoginPinDto {
  @IsString()
  cashierId!: string

  @IsString()
  @Length(4, 6)
  pin!: string
}