import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { DiscountsService } from './discounts.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { RolesGuard } from 'src/auth/guards/roles.guard';

import { Roles } from 'src/auth/decorators/roles.decorator';

import { Role } from '@prisma/client';

import { CreateDiscountDto } from './dto/create-discount.dto';

import { UpdateDiscountDto } from './dto/update-discount.dto';

@Controller('discounts')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class DiscountsController {
  constructor(
    private readonly discountsService: DiscountsService,
  ) {}

  @Post()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
  )
  create(
    @Body()
    dto: CreateDiscountDto,

    @Req()
    req,
  ) {
    return this.discountsService.create(
      dto,
      req.user.id,
    );
  }

  @Get()
  findAll() {
    return this.discountsService.findAll();
  }

  @Get('active')
  findActive() {
    return this.discountsService.findActive();
  }

  @Get('validate')
  validateDiscount(
    @Query('code')
    code: string,

    @Query('subtotal')
    subtotal: string,
  ) {
    return this.discountsService.validateDiscount(
      code,
      Number(subtotal),
    );
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.discountsService.findOne(
      id,
    );
  }

  @Patch(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
  )
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateDiscountDto,
  ) {
    return this.discountsService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(
    @Param('id')
    id: string,
  ) {
    return this.discountsService.remove(
      id,
    );
  }
}