import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

import { DiscountService } from './discount.service';

import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { AssignProductDto } from './dto/assign-product.dto';

@Controller('discounts')
@UseGuards(JwtAuthGuard)
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  create(
    @Body()
    dto: CreateDiscountDto,
  ) {
    return this.discountService.create(dto);
  }

  @Get('store/:storeId')
  findAll(
    @Param('storeId')
    storeId: string,
  ) {
    return this.discountService.findAll(storeId);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.discountService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateDiscountDto,
  ) {
    return this.discountService.update(id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id')
    id: string,
  ) {
    return this.discountService.remove(id);
  }

  @Post(':discountId/products')
  assignProduct(
    @Param('discountId')
    discountId: string,

    @Body()
    dto: AssignProductDto,
  ) {
    return this.discountService.assignProduct(discountId, dto);
  }

  @Delete(':discountId/products/:productId')
  removeProduct(
    @Param('discountId')
    discountId: string,

    @Param('productId')
    productId: string,
  ) {
    return this.discountService.removeProduct(discountId, productId);
  }
}
