import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { Role } from '@prisma/client';

import { OutletService } from './outlet.service';

import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { RolesGuard } from 'src/auth/guards/roles.guard';

import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('outlets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutletController {
  constructor(
    private readonly outletService: OutletService,
  ) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('qrisImage'),
  )
  create(
    @Body()
    dto: CreateOutletDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.outletService.create(
      dto,
      file,
    );
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
  )
  findAll() {
    return this.outletService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
  )
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.outletService.findOne(
      id,
    );
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('qrisImage'),
  )
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateOutletDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.outletService.update(
      id,
      dto,
      file,
    );
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(
    @Param('id')
    id: string,
  ) {
    return this.outletService.remove(
      id,
    );
  }
}
