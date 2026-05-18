import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  // GET KARYAWAN
  @Roles('SUPER_ADMIN')
  @Get('karyawan')
  getKaryawan() {
    return this.userService.getKaryawan();
  }

  // GET ALL USERS
  @Roles('SUPER_ADMIN')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // GET PROFILE
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get(':id/profile')
  profile(@Param('id') id: string) {
    return this.userService.profile(id);
  }

  // GET DETAIL USER
  @Roles('SUPER_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  // DELETE USER
  @Roles('SUPER_ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}