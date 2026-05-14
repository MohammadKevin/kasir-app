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

import { ExpenseService } from './expense.service';

import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.expenseService.create(dto);
  }

  @Get()
  findAll() {
    return this.expenseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenseService.remove(id);
  }
}
