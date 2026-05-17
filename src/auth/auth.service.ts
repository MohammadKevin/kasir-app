import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from 'src/prisma/prisma.service';

import { MailService } from 'src/mail/mail.service';

import * as bcrypt from 'bcrypt';

import { randomUUID } from 'crypto';

import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },

      include: {
        outlet: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login berhasil',

      accessToken,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        outlet: user.outlet,
      },
    };
  }

  async createAdmin(dto: CreateAdminDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah digunakan');
    }

    const outlet = await this.prisma.outlet.findUnique({
      where: {
        id: dto.outletId,
      },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet tidak ditemukan');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        password: hashedPassword,
        role: 'ADMIN',
        outletId: dto.outletId,
      },
    });

    return {
      message: 'Admin berhasil dibuat',

      data: admin,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const resetToken = randomUUID();

    const resetTokenExp = new Date(Date.now() + 1000 * 60 * 15);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        resetToken,
        resetTokenExp,
      },
    });

    return {
      message: 'Reset password berhasil dibuat',

      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
      },
    });

    if (!user) {
      throw new BadRequestException('Token tidak valid');
    }

    if (!user.resetTokenExp || user.resetTokenExp < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        password: hashedPassword,

        resetToken: null,
        resetTokenExp: null,
      },
    });

    return {
      message: 'Password berhasil direset',
    };
  }

  async getProfile(userId: string) {
    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,

        outlet: {
          select: {
            id: true,
            name: true,
            noTelp: true,
            address: true,
            qrisImage: true,
          },
        },
      },
    });
  }
}
