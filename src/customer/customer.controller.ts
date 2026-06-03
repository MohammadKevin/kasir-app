import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'

import { CustomerService } from './customer.service'

import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateCustomerDto,
  ) {
    return this.customerService.create(
      dto,
    )
  }

  @Get('store/:storeId')
  findAll(
    @Param('storeId')
    storeId: string,
  ) {
    return this.customerService.findAll(
      storeId,
    )
  }

  @Get('phone/:phone')
  findByPhone(
    @Param('phone')
    phone: string,
  ) {
    return this.customerService.findByPhone(
      phone,
    )
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.customerService.findOne(
      id,
    )
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateCustomerDto,
  ) {
    return this.customerService.update(
      id,
      dto,
    )
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.customerService.remove(
      id,
    )
  }
}