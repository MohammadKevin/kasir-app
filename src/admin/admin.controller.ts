import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('admins')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private checkAdminRole(req: Request & { user?: { type: string } }) {
    if (!req.user || req.user.type !== 'ADMIN') {
      throw new ForbiddenException(
        'Akses ditolak. Fitur ini hanya tersedia untuk akun Admin.',
      );
    }
  }

  @Get()
  findAll(
    @Req()
    req: Request & { user: { type: string } },
  ) {
    this.checkAdminRole(req);
    return this.adminService.findAll();
  }

  @Post()
  create(
    @Req()
    req: Request & { user: { type: string } },
    @Body()
    dto: CreateAdminDto,
  ) {
    this.checkAdminRole(req);
    return this.adminService.create(dto);
  }

  @Delete(':id')
  remove(
    @Req()
    req: Request & { user: { type: string } },
    @Param('id')
    id: string,
  ) {
    this.checkAdminRole(req);
    return this.adminService.remove(id);
  }
}
