import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,

    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: config.getOrThrow('JWT_SECRET'),

      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    payload: {
      sub: string;
      type: string;
    },
  ) {
    // Session checks bypassed to allow independent login/logout on multiple devices (stateless JWT)
    /*
    const session = await this.prisma.session.findUnique({
      where: {
        userId_userType: {
          userId: payload.sub,
          userType: payload.type,
        },
      },
    })

    if (!session) {
      throw new UnauthorizedException(
        'Sesi Anda tidak valid atau telah berakhir.',
      )
    }

    // Check token matches session (Bypassed to allow concurrent device usage)
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    if (session.token !== token) {
      throw new UnauthorizedException(
        'Sesi Anda telah aktif di perangkat lain.',
      )
    }

    const oneMinuteAgo = new Date(Date.now() - 60000)
    if (session.lastActive < oneMinuteAgo) {
      await this.prisma.session.update({
        where: {
          userId_userType: {
            userId: payload.sub,
            userType: payload.type,
          },
        },
        data: {
          lastActive: new Date(),
        },
      }).catch(() => {})
    }
    */

    if (payload.type === 'ADMIN') {
      const admin = await this.prisma.admin.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!admin) {
        throw new UnauthorizedException('Admin tidak ditemukan');
      }

      return {
        ...admin,
        type: 'ADMIN',
      };
    }

    const store = await this.prisma.store.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!store) {
      throw new UnauthorizedException('Store tidak ditemukan');
    }

    if (!store.isActive) {
      throw new UnauthorizedException('Store tidak aktif');
    }

    return {
      ...store,
      type: 'STORE',
    };
  }
}
