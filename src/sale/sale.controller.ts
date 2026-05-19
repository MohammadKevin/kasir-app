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

import { SaleService } from './sale.service';

import { CreateSaleDto } from './dto/create-sale.dto';
import { CancelSaleDto } from './dto/cancel-sale.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('sales')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateSaleDto,
  ) {
    return this.saleService.create(
      dto,
    );
  }

  @Get()
  findAll() {
    return this.saleService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.saleService.findOne(
      id,
    );
  }

  @Patch(':id/cancel')
  cancelSale(
    @Param('id')
    id: string,

    @Body()
    dto: CancelSaleDto,

    @Req()
    req,
  ) {
    return this.saleService.cancelSale(
      id,

      req.user.id,

      dto.reason,
    );
  }
}