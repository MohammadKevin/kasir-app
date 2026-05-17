import { Body, Controller, Post, UseGuards, Get, Req } from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Roles('SUPER_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('create-admin')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.createAdmin(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return req.user;
  }
}
