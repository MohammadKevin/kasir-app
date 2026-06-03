import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard'

import { CashierService } from './cashier.service'

import { CreateCashierDto } from './dto/create-cashier.dto'
import { UpdateCashierDto } from './dto/update-cashier.dto'
import { LoginPinDto } from './dto/login-pin.dto'

@Controller('cashier')
export class CashierController {
  constructor(
    private readonly cashierService: CashierService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req()
    req: any,

    @Body()
    dto: CreateCashierDto,
  ) {
    return this.cashierService.create(
      req.user.id,
      dto,
    )
  }

  @Get('store/:storeId')
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('storeId')
    storeId: string,
  ) {
    return this.cashierService.findAll(
      storeId,
    )
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.cashierService.findOne(
      id,
    )
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateCashierDto,
  ) {
    return this.cashierService.update(
      id,
      dto,
    )
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id')
    id: string,
  ) {
    return this.cashierService.remove(
      id,
    )
  }

  @Post('login-pin')
  loginPin(
    @Body()
    dto: LoginPinDto,
  ) {
    return this.cashierService.loginPin(
      dto,
    )
  }
}