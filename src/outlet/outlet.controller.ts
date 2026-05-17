import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { OutletService } from './outlet.service';

import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

@Controller('outlets')
export class OutletController {
  constructor(private readonly outletService: OutletService) {}

  @Post()
  @UseInterceptors(FileInterceptor('qrisImage'))
  create(
    @Body()
    dto: CreateOutletDto,

    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.outletService.create(dto, file);
  }

  @Get()
  findAll() {
    return this.outletService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.outletService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('qrisImage'))
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateOutletDto,

    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.outletService.update(id, dto, file);
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.outletService.remove(id);
  }
}
