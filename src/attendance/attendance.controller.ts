import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import { ClockDto } from './dto/clock.dto';
import type { Request } from 'express';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(@Body() dto: ClockDto) {
    return this.attendanceService.clockIn(dto);
  }

  @Post('clock-out')
  clockOut(@Body() dto: ClockDto) {
    return this.attendanceService.clockOut(dto);
  }

  @Get('status/:userId')
  getStatus(@Param('userId') userId: string) {
    return this.attendanceService.getStatus(userId);
  }

  @Post('store/open')
  openStore(
    @Req()
    req: Request & {
      user: {
        id: string;
        type: string;
      };
    },
    @Body() dto: { storeId?: string },
  ) {
    const storeId = req.user.type === 'STORE' ? req.user.id : dto.storeId;
    if (!storeId) {
      throw new BadRequestException('storeId wajib diisi');
    }
    return this.attendanceService.openStore(storeId);
  }

  @Post('store/close')
  closeStore(
    @Req()
    req: Request & {
      user: {
        id: string;
        type: string;
      };
    },
    @Body() dto: { storeId?: string },
  ) {
    const storeId = req.user.type === 'STORE' ? req.user.id : dto.storeId;
    if (!storeId) {
      throw new BadRequestException('storeId wajib diisi');
    }
    return this.attendanceService.closeStore(storeId);
  }

  @Get('store/status')
  getStoreStatusSelf(
    @Req()
    req: Request & {
      user: {
        id: string;
        type: string;
      };
    },
  ) {
    if (req.user.type !== 'STORE') {
      throw new BadRequestException('Endpoint ini hanya untuk Store');
    }
    return this.attendanceService.getStoreStatus(req.user.id);
  }

  @Get('store/status/:storeId')
  getStoreStatus(@Param('storeId') storeId: string) {
    return this.attendanceService.getStoreStatus(storeId);
  }

  @Get('store/history/:storeId')
  getStoreHistory(@Param('storeId') storeId: string) {
    return this.attendanceService.findStoreAttendanceHistory(storeId);
  }

  @Get('store/:storeId')
  findAllByStore(@Param('storeId') storeId: string) {
    return this.attendanceService.findAllByStore(storeId);
  }
}
