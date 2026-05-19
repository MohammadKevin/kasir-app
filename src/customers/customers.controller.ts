import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CustomersService } from './customers.service';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  create(
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(
      createCustomerDto,
    );
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.customersService.search(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(
      id,
      updateCustomerDto,
    );
  }

  @Patch(':id/points')
  addPoints(
    @Param('id') id: string,
    @Body('points') points: number,
  ) {
    return this.customersService.addPoints(
      id,
      points,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}