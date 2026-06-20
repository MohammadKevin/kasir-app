import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: {
        email: dto.email,
      },

      include: {
        stores: {
          select: {
            id: true,
          },
        },
      },
    });

    if (admin) {
      const valid = await bcrypt.compare(dto.password, admin.password);

      if (!valid) {
        throw new UnauthorizedException('Email atau password salah');
      }

      // Check existing session (Bypassed to allow concurrent device usage)
      /*
      const existingSession = await this.prisma.session.findUnique({
        where: { userId_userType: { userId: admin.id, userType: 'ADMIN' } }
      })

      if (existingSession) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
        if (existingSession.lastActive > tenMinutesAgo) {
          throw new UnauthorizedException(
            'Akun ini sedang aktif di perangkat lain. Silakan log out terlebih dahulu atau tunggu sesi sebelumnya berakhir.'
          )
        }
      }
      */

      const accessToken = await this.jwt.signAsync({
        sub: admin.id,
        type: 'ADMIN',
      });

      // Upsert current session
      await this.prisma.session.upsert({
        where: { userId_userType: { userId: admin.id, userType: 'ADMIN' } },
        update: { token: accessToken, lastActive: new Date() },
        create: {
          userId: admin.id,
          userType: 'ADMIN',
          token: accessToken,
          lastActive: new Date(),
        },
      });

      return {
        accessToken,

        user: {
          id: admin.id,

          name: admin.name,

          type: 'ADMIN',

          storeId: admin.stores?.[0]?.id ?? null,
        },
      };
    }

    const store = await this.prisma.store.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!store) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const valid = await bcrypt.compare(dto.password, store.password);

    if (!valid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Check existing session (Bypassed to allow concurrent device usage)
    /*
    const existingSession = await this.prisma.session.findUnique({
      where: { userId_userType: { userId: store.id, userType: 'STORE' } }
    })

    if (existingSession) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      if (existingSession.lastActive > tenMinutesAgo) {
        throw new UnauthorizedException(
          'Akun ini sedang aktif di perangkat lain. Silakan log out terlebih dahulu atau tunggu sesi sebelumnya berakhir.'
        )
      }
    }
    */

    const accessToken = await this.jwt.signAsync({
      sub: store.id,
      type: 'STORE',
    });

    // Upsert current session
    await this.prisma.session.upsert({
      where: { userId_userType: { userId: store.id, userType: 'STORE' } },
      update: { token: accessToken, lastActive: new Date() },
      create: {
        userId: store.id,
        userType: 'STORE',
        token: accessToken,
        lastActive: new Date(),
      },
    });

    return {
      accessToken,

      user: {
        id: store.id,

        name: store.name,

        type: 'STORE',

        storeId: store.id,
      },
    };
  }

  async logout(userId: string, userType: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        userType,
      },
    });
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    let userType: 'ADMIN' | 'STORE' | null = null;
    let userId: string | null = null;
    let userName: string | null = null;

    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (admin) {
      userType = 'ADMIN';
      userId = admin.id;
      userName = admin.name;
    } else {
      const store = await this.prisma.store.findUnique({
        where: { email: dto.email },
      });
      if (store) {
        userType = 'STORE';
        userId = store.id;
        userName = store.name;
      }
    }

    if (!userId || !userType || !userName) {
      throw new NotFoundException('Email tidak terdaftar');
    }

    const token = await this.jwt.signAsync(
      {
        sub: userId,
        type: userType,
        action: 'RESET_PASSWORD',
      },
      {
        expiresIn: '15m',
      },
    );

    const frontendUrl =
      this.config.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const smtpHost = this.config.get('SMTP_HOST');
    const smtpPort = this.config.get('SMTP_PORT');
    const smtpUser = this.config.get('SMTP_USER');
    const smtpPass = this.config.get('SMTP_PASS');
    const smtpFrom = this.config.get('SMTP_FROM') || 'noreply@kasirapp.com';

    let emailSent = false;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(smtpPort),
          secure: Number(smtpPort) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: dto.email,
          subject: 'Reset Password Kasir App',
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #2563eb;">Reset Password</h2>
              <p>Halo ${userName},</p>
              <p>Anda menerima email ini karena Anda (atau orang lain) meminta pengaturan ulang password untuk akun Anda di Kasir App.</p>
              <p>Silakan klik tombol di bawah ini untuk mengatur ulang password Anda. Link ini hanya berlaku selama 15 menit.</p>
              <div style="margin: 24px 0;">
                <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Atur Ulang Password</a>
              </div>
              <p>Jika Anda tidak meminta pengaturan ulang ini, silakan abaikan email ini dan password Anda akan tetap aman.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="font-size: 12px; color: #6b7280;">Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
              <p style="font-size: 12px; color: #2563eb; word-break: break-all;">${resetUrl}</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (err) {
        console.error('Gagal mengirim email reset password:', err);
      }
    } else {
      console.log('\n=======================================');
      console.log('RESET PASSWORD LINK (STDOUT DEBUG):');
      console.log(resetUrl);
      console.log('=======================================\n');
    }

    return {
      message: 'Link reset password telah dikirim ke email Anda.',
      resetLink: resetUrl,
      emailSent,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(dto.token);
    } catch (err) {
      throw new BadRequestException(
        'Token reset password tidak valid atau sudah kedaluwarsa',
      );
    }

    if (payload.action !== 'RESET_PASSWORD') {
      throw new BadRequestException(
        'Token tidak valid untuk pengaturan ulang password',
      );
    }

    const userId = payload.sub;
    const userType = payload.type;

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    if (userType === 'ADMIN') {
      await this.prisma.admin.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } else if (userType === 'STORE') {
      await this.prisma.store.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } else {
      throw new BadRequestException('Tipe user tidak dikenal');
    }

    return {
      message: 'Password berhasil diperbarui',
    };
  }
}
