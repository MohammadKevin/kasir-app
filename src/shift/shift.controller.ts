import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common'

import { ShiftService } from './shift.service'

import { OpenShiftDto } from './dto/open-shift.dto'
import { CloseShiftDto } from './dto/close-shift.dto'

@Controller('shifts')
export class ShiftController {
  constructor(
    private readonly shiftService: ShiftService,
  ) {}

  @Post('open')
  open(
    @Body()
    dto: OpenShiftDto,
  ) {
    return this.shiftService.open(
      dto,
    )
  }

  @Post('close/:id')
  close(
    @Param('id')
    id: string,

    @Body()
    dto: CloseShiftDto,
  ) {
    return this.shiftService.close(
      id,
      dto.closingCash,
    )
  }

  @Get('store/:storeId')
  findAll(
    @Param('storeId')
    storeId: string,
  ) {
    return this.shiftService.findAll(
      storeId,
    )
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.shiftService.findOne(
      id,
    )
  }
}