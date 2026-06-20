import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ExpenseService } from './expense.service';

import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(
    @Body()
    dto: CreateExpenseDto,
  ) {
    return this.expenseService.create(dto);
  }

  @Get('store/:storeId')
  findAll(
    @Param('storeId')
    storeId: string,
  ) {
    return this.expenseService.findAll(storeId);
  }

  @Get('summary/:storeId')
  summary(
    @Param('storeId')
    storeId: string,
  ) {
    return this.expenseService.summary(storeId);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.expenseService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateExpenseDto,
  ) {
    return this.expenseService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.expenseService.remove(id);
  }
}
