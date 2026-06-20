import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { PurchaseService } from './purchase.service';

import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  create(
    @Body()
    dto: CreatePurchaseDto,
  ) {
    return this.purchaseService.create(dto);
  }

  @Get('store/:storeId')
  findAll(
    @Param('storeId')
    storeId: string,
  ) {
    return this.purchaseService.findAll(storeId);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.purchaseService.findOne(id);
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.purchaseService.remove(id);
  }
}
