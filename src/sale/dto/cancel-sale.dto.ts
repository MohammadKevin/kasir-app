// sale/dto/cancel-sale.dto.ts

import { IsString } from 'class-validator';

export class CancelSaleDto {
  @IsString()
  reason!: string;
}