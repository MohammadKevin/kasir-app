import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.transactionService.create({
      ...dto,
      cashierId: dto.cashierId || req.user?.id,
      storeId: dto.storeId || req.user?.storeId || req.body?.storeId,
    });
  }

  @Get('store/:storeId')
  findAll(
    @Param('storeId')
    storeId: string,
  ) {
    return this.transactionService.findAll(storeId);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.transactionService.findOne(id);
  }

  @Patch(':id/void')
  voidTransaction(
    @Param('id')
    id: string,

    @Body()
    dto: VoidTransactionDto,
  ) {
    return this.transactionService.void(id, dto.reason);
  }

  @Get(':id/receipt')
  receipt(
    @Param('id')
    id: string,
  ) {
    return this.transactionService.receipt(id);
  }
}
