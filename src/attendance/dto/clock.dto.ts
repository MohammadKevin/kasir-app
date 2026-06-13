import { IsNotEmpty, IsString } from 'class-validator'

export class ClockDto {
  @IsString()
  @IsNotEmpty()
  userId: string
}
