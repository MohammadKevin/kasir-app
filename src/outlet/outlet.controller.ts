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

import { OutletService } from './outlet.service';

import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('outlets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutletController {
  constructor(private readonly outletService: OutletService) {}

  @Roles('SUPER_ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('qrisImage'))
  create(
    @Body() dto: CreateOutletDto,

    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.outletService.create(dto, file);
  }

  @Roles('SUPER_ADMIN')
  @Get()
  findAll() {
    return this.outletService.findAll();
  }

  @Roles('SUPER_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.outletService.findOne(id);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('qrisImage'))
  update(
    @Param('id') id: string,

    @Body() dto: UpdateOutletDto,

    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.outletService.update(id, dto, file);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.outletService.remove(id);
  }
}
