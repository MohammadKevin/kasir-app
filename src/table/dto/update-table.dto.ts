import { IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  number?: string

  @IsNumber()
  @IsOptional()
  capacity?: number

  @IsString()
  @IsOptional()
  status?: string // AVAILABLE, OCCUPIED, BILLING
}
