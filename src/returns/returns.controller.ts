import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ReturnsService } from './returns.service';

import { CreateReturnDto } from './dto/create-return.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(
    private readonly returnsService: ReturnsService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateReturnDto,

    @Req() req,
  ) {
    return this.returnsService.create(
      dto,

      req.user.id,
    );
  }

  @Get()
  findAll() {
    return this.returnsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.returnsService.findOne(id);
  }
}