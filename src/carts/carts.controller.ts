import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CartsService } from './carts.service';

import { CreateCartDto } from './dto/create-cart.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  create(@Body() createCartDto: CreateCartDto) {
    return this.cartsService.create(createCartDto);
  }

  @Get()
  findAll() {
    return this.cartsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(id);
  }

  @Post(':id/items')
  addItem(
    @Param('id') id: string,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartsService.addItem(id, dto);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    return this.cartsService.removeItem(itemId);
  }

  @Patch(':id/hold')
  holdCart(@Param('id') id: string) {
    return this.cartsService.holdCart(id);
  }

  @Patch(':id/complete')
  completeCart(@Param('id') id: string) {
    return this.cartsService.completeCart(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.cartsService.delete(id);
  }
}