import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import * as bcrypt from 'bcrypt'

import { JwtService } from '@nestjs/jwt'

import { PrismaService } from 'src/prisma/prisma.service'

import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly jwt: JwtService,
  ) { }

  async login(
    dto: LoginDto,
  ) {
    const admin =
      await this.prisma.admin.findUnique({
        where: {
          email:
            dto.email,
        },

        include: {
          stores: {
            select: {
              id: true,
            },
          },
        },
      })

    if (admin) {
      const valid =
        await bcrypt.compare(
          dto.password,
          admin.password,
        )

      if (!valid) {
        throw new UnauthorizedException(
          'Email atau password salah',
        )
      }

      return {
        accessToken:
          await this.jwt.signAsync({
            sub:
              admin.id,

            type:
              'ADMIN',
          }),

        user: {
          id:
            admin.id,

          name:
            admin.name,

          type:
            'ADMIN',

          storeId:
            admin
              .stores?.[0]
              ?.id ??
            null,
        },
      }
    }

    const store =
      await this.prisma.store.findUnique({
        where: {
          email:
            dto.email,
        },
      })

    if (!store) {
      throw new UnauthorizedException(
        'Email atau password salah',
      )
    }

    const valid =
      await bcrypt.compare(
        dto.password,
        store.password,
      )

    if (!valid) {
      throw new UnauthorizedException(
        'Email atau password salah',
      )
    }

    return {
      accessToken:
        await this.jwt.signAsync({
          sub:
            store.id,

          type:
            'STORE',
        }),

      user: {
        id:
          store.id,

        name:
          store.name,

        type:
          'STORE',

        storeId:
          store.id,
      },
    }
  }
}