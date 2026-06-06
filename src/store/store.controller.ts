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
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
  ) {}

  @Post()
  create(
    @Req()
    req: Request & {
      user: {
        id: string;
        type: string;
      };
    },

    @Body()
    dto: CreateStoreDto,
  ) {
    return this.storeService.create(
      req.user.id,
      dto,
    );
  }

  @Get()
  findAll(
    @Req()
    req: Request & {
      user: {
        id: string;
      };
    },
  ) {
    return this.storeService.findAll(
      req.user.id,
    );
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.storeService.findOne(
      id,
    );
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateStoreDto,
  ) {
    return this.storeService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
remove(
  @Param('id')
  id: string,
) {
  return this.storeService.remove(
    id,
  )
}
}