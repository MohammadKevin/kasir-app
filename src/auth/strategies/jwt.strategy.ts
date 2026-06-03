import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { PassportStrategy } from '@nestjs/passport'

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt'

import { ConfigService } from '@nestjs/config'

import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    config: ConfigService,

    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration:
        false,

      secretOrKey:
        config.getOrThrow(
          'JWT_SECRET',
        ),
    })
  }

  async validate(
    payload: {
      sub: string
      type: string
    },
  ) {
    if (
      payload.type ===
      'ADMIN'
    ) {
      const admin =
        await this.prisma.admin.findUnique({
          where: {
            id: payload.sub,
          },
        })

      if (!admin) {
        throw new UnauthorizedException(
          'Admin tidak ditemukan',
        )
      }

      return {
        ...admin,
        type:
          'ADMIN',
      }
    }

    const store =
      await this.prisma.store.findUnique({
        where: {
          id: payload.sub,
        },
      })

    if (!store) {
      throw new UnauthorizedException(
        'Store tidak ditemukan',
      )
    }

    if (!store.isActive) {
      throw new UnauthorizedException(
        'Store tidak aktif',
      )
    }

    return {
      ...store,
      type:
        'STORE',
    }
  }
}