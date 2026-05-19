import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CashierShiftsService } from './cashier-shifts.service';

import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

@Controller('cashier-shifts')
export class CashierShiftsController {
  constructor(
    private readonly cashierShiftsService: CashierShiftsService,
  ) {}

  @Post('open/:cashierId/:outletId')
  openShift(
    @Param('cashierId') cashierId: string,
    @Param('outletId') outletId: string,
    @Body() dto: OpenShiftDto,
  ) {
    return this.cashierShiftsService.openShift(
      cashierId,
      outletId,
      dto,
    );
  }

  @Patch('close/:shiftId')
  closeShift(
    @Param('shiftId') shiftId: string,
    @Body() dto: CloseShiftDto,
  ) {
    return this.cashierShiftsService.closeShift(
      shiftId,
      dto,
    );
  }

  @Get()
  findAll() {
    return this.cashierShiftsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashierShiftsService.findOne(id);
  }

  @Get('active/:cashierId')
  getActiveShift(
    @Param('cashierId') cashierId: string,
  ) {
    return this.cashierShiftsService.getActiveShift(
      cashierId,
    );
  }
}