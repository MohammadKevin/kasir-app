import {
 IsEnum,
 IsInt,
 IsOptional,
 IsString,
 Min,
} from 'class-validator'

import {
 StockMovementType,
} from './create-stock-movement.dto'

export class ScanStockDto {

 @IsString()
 storeId!: string

 @IsString()
 barcode!: string

 @IsInt()
 @Min(1)
 qty!: number

 @IsEnum(
   StockMovementType,
 )
 type!:
  StockMovementType

 @IsOptional()
 @IsString()
 note?: string
}