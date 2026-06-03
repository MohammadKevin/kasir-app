import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(id: string) {
    const cashier =
      await this.prisma.user.findUnique({
        where: {
          id,
        },

        include: {
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

    if (!cashier) {
      throw new NotFoundException(
        'Cashier tidak ditemukan',
      )
    }

    return cashier
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ) {
    await this.findOne(id)

    return this.prisma.user.update({
      where: {
        id,
      },

      data: {
        ...dto,
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  }

  async remove(id: string) {
    await this.findOne(id)

    await this.prisma.user.delete({
      where: {
        id,
      },
    })

    return {
      message:
        'Cashier berhasil dihapus',
    }
  }
}