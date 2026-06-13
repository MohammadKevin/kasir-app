import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator'

import { PaymentMethod } from '@prisma/client'

import { TransactionItemDto } from './transaction-item.dto'

export class CreateTransactionDto {
  @IsString()
  storeId!: string

  @IsString()
  cashierId!: string

  @IsOptional()
  @IsString()
  customerId?: string

  @IsOptional()
  @IsString()
  customerName?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsBoolean()
  saveCustomer?: boolean

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod

  @IsInt()
  paidAmount!: number

  @IsOptional()
  @IsInt()
  subtotal?: number

  @IsOptional()
  @IsInt()
  totalDiscount?: number

  @IsOptional()
  @IsInt()
  total?: number

  @IsOptional()
  @IsString()
  orderType?: string

  @IsOptional()
  @IsString()
  tableId?: string

  @IsOptional()
  @IsInt()
  taxAmount?: number

  @IsOptional()
  @IsInt()
  serviceAmount?: number

  @IsOptional()
  splitPayments?: any

  @IsOptional()
  @IsInt()
  pointsEarned?: number

  @IsOptional()
  @IsInt()
  pointsRedeemed?: number

  @IsArray()
  items!: TransactionItemDto[]
}