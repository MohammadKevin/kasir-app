import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { StockMovementsService } from './stock-movements.service';

import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockMovementsController {
  constructor(
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  @Post()
  createAdjustment(
    @Body() dto: CreateStockAdjustmentDto,

    @Req() req,
  ) {
    return this.stockMovementsService.createAdjustment(
      dto,

      req.user.id,
    );
  }

  @Get()
  findAll() {
    return this.stockMovementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockMovementsService.findOne(
      id,
    );
  }

  @Get('product/:productId')
  getProductHistory(
    @Param('productId') productId: string,
  ) {
    return this.stockMovementsService.getProductHistory(
      productId,
    );
  }
}