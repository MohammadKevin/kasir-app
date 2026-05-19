import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CashiersService } from './cashiers.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { RolesGuard } from 'src/auth/guards/roles.guard';

import { CreateCashierDto } from './dto/create-cashier.dto';
import { UpdateCashierDto } from './dto/update-cashier.dto';

@Controller('cashiers')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class CashiersController {
  constructor(
    private readonly cashiersService: CashiersService,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateCashierDto,
  ) {
    return this.cashiersService.create(
      dto,
    );
  }

  @Get()
  findAll() {
    return this.cashiersService.findAll();
  }

  @Get('outlet')
  findByOutlet(
    @Query('outletId')
    outletId: string,
  ) {
    return this.cashiersService.findByOutlet(
      outletId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.cashiersService.findOne(
      id,
    );
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateCashierDto,
  ) {
    return this.cashiersService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.cashiersService.remove(
      id,
    );
  }
}