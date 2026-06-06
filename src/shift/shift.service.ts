import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  ShiftStatus,
  TransactionStatus,
} from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

import { OpenShiftDto } from './dto/open-shift.dto'

@Injectable()
export class ShiftService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async open(
    dto: OpenShiftDto,
  ) {
    const store =
      await this.prisma.store.findUnique({
        where: {
          id: dto.storeId,
        },
      })

    if (!store) {
      throw new NotFoundException(
        'Store tidak ditemukan',
      )
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          id: dto.userId,
        },
      })

    if (!user) {
      throw new NotFoundException(
        'Kasir tidak ditemukan',
      )
    }

    const active =
      await this.prisma.shift.findFirst({
        where: {
          storeId: dto.storeId,
          userId: dto.userId,
          status: ShiftStatus.OPEN,
        },
      })

    if (active) {
      throw new ConflictException(
        'Shift masih terbuka',
      )
    }

    return this.prisma.shift.create({
      data: {
        storeId:
          dto.storeId,

        userId:
          dto.userId,

        openingCash:
          Number(
            dto.openingCash,
          ),

        status:
          ShiftStatus.OPEN,
      },

      include: {
        user: true,
      },
    })
  }

  async close(
    id: string,
    closingCash: number,
  ) {
    const shift =
      await this.prisma.shift.findUnique({
        where: {
          id,
        },
      })

    if (!shift) {
      throw new NotFoundException(
        'Shift tidak ditemukan',
      )
    }

    if (
      shift.status ===
      ShiftStatus.CLOSED
    ) {
      throw new ConflictException(
        'Shift already sudah ditutup',
      )
    }

    const sales =
      await this.prisma.transaction.aggregate({
        _sum: {
          total: true,
        },

        where: {
          storeId:
            shift.storeId,

          status:
            TransactionStatus.PAID,

          createdAt: {
            gte:
              shift.createdAt,
          },
        },
      })

    const cashSales =
      sales._sum.total ??
      0

    const expectedCash =
      Number(
        shift.openingCash,
      ) +
      Number(
        cashSales,
      )

    const difference =
      Number(
        closingCash,
      ) -
      expectedCash

    const updated =
      await this.prisma.shift.update({
        where: {
          id,
        },

        data: {
          closingCash:
            Number(
              closingCash,
            ),

          closedAt:
            new Date(),

          status:
            ShiftStatus.CLOSED,
        },

        include: {
          user: true,
        },
      })

    return {
      shift:
        updated,

      summary: {
        openingCash:
          shift.openingCash,

        cashSales,

        expectedCash,

        closingCash,

        difference,
      },
    }
  }

  async findAll(
    storeId: string,
  ) {
    return this.prisma.shift.findMany({
      where: {
        storeId,
      },

      include: {
        user: {
          select: {
            name: true,
          },
        },
      },

      orderBy: {
        createdAt:
          'desc',
      },
    })
  }

  async findOne(
    id: string,
  ) {
    return this.prisma.shift.findUnique({
      where: {
        id,
      },

      include: {
        user: true,
      },
    })
  }
}