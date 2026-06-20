import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.notificationService.findAll(req.user.id, req.user.type);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id, req.user.type);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationService.markAsRead(id, req.user.id, req.user.type);
  }
}
