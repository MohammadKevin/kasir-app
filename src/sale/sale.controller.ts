import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SaleService } from './sale.service';

import { CreateSaleDto } from './dto/create-sale.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  create(
    @Body() dto: CreateSaleDto,

    @Req() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.saleService.create(dto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.saleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saleService.findOne(id);
  }
}
