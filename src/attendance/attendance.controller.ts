import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard'
import { AttendanceService } from './attendance.service'
import { ClockDto } from './dto/clock.dto'

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(@Body() dto: ClockDto) {
    return this.attendanceService.clockIn(dto)
  }

  @Post('clock-out')
  clockOut(@Body() dto: ClockDto) {
    return this.attendanceService.clockOut(dto)
  }

  @Get('status/:userId')
  getStatus(@Param('userId') userId: string) {
    return this.attendanceService.getStatus(userId)
  }

  @Get('store/:storeId')
  findAllByStore(@Param('storeId') storeId: string) {
    return this.attendanceService.findAllByStore(storeId)
  }
}
