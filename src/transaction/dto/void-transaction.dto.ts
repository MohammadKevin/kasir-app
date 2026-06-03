import { IsString } from 'class-validator'

export class VoidTransactionDto {
  @IsString()
  reason!: string
}