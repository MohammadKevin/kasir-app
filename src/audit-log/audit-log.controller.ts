import { Controller, Get, Param } from '@nestjs/common';

import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  findAll() {
    return this.auditLogService.findAll();
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId')
    userId: string,
  ) {
    return this.auditLogService.findByUser(userId);
  }
}
