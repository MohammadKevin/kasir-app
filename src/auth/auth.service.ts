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

import { Role } from '@prisma/client';

import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async login(dto: LoginDto) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },

        include: {
          outlet: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Email atau password salah',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Akun tidak aktif',
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        dto.password,
        user.password,
      );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Email atau password salah',
      );
    }

    let cashiers: {
  id: string;
  name: string;
}[] = [];

    if (user.outletId) {
      cashiers =
        await this.prisma.cashier.findMany({
          where: {
            outletId: user.outletId,
            isActive: true,
          },

          select: {
            id: true,
            name: true,
          },

          orderBy: {
            name: 'asc',
          },
        });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

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

      cashiers,
    };
  }

  async createAdmin(
    dto: CreateAdminDto,
  ) {
    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

    if (existingUser) {
      throw new BadRequestException(
        'Email sudah digunakan',
      );
    }

    const outlet =
      await this.prisma.outlet.findUnique({
        where: {
          id: dto.outletId,
        },
      });

    if (!outlet) {
      throw new NotFoundException(
        'Outlet tidak ditemukan',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        dto.password,
        10,
      );

    const admin =
      await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          role: Role.ADMIN,
          outletId: dto.outletId,
        },

        include: {
          outlet: true,
        },
      });

    return {
      message:
        'Admin berhasil dibuat',

      data: admin,
    };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan',
      );
    }

    const resetToken =
      randomUUID();

    const resetTokenExp =
      new Date(
        Date.now() + 1000 * 60 * 15,
      );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        resetToken,
        resetTokenExp,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Reset Password',
      html: `
        <div style="font-family:sans-serif">
          <h2>Reset Password</h2>

          <p>Klik tombol di bawah untuk reset password:</p>

          <a
            href="${resetLink}"
            style="
              display:inline-block;
              padding:10px 20px;
              background:#000;
              color:#fff;
              text-decoration:none;
              border-radius:8px;
            "
          >
            Reset Password
          </a>

          <p>Link berlaku 15 menit.</p>
        </div>
      `,
    });

    return {
      message:
        'Link reset password berhasil dikirim',
    };
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          resetToken: dto.token,
        },
      });

    if (!user) {
      throw new BadRequestException(
        'Token tidak valid',
      );
    }

    if (
      !user.resetTokenExp ||
      user.resetTokenExp <
        new Date()
    ) {
      throw new BadRequestException(
        'Token expired',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        dto.newPassword,
        10,
      );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return {
      message:
        'Password berhasil direset',
    };
  }

  async getProfile(
    userId: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
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
              address: true,
              noTelp: true,
              qrisImage: true,
            },
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan',
      );
    }

    return user;
  }
}
