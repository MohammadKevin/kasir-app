import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  ShiftStatus,
  PaymentMethod,
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
    const existing =
      await this.prisma.shift.findFirst({
        where: {
          userId: dto.userId,
          status: ShiftStatus.OPEN,
        },
      })

    if (existing) {
      throw new BadRequestException(
        'Masih ada shift yang terbuka',
      )
    }

    return this.prisma.shift.create({
      data: {
        storeId: dto.storeId,
        userId: dto.userId,
        openingCash:
          dto.openingCash,
      },
    })
  }

  async close(
    shiftId: string,
    closingCash: number,
  ) {
    const shift =
      await this.prisma.shift.findUnique({
        where: {
          id: shiftId,
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
      throw new BadRequestException(
        'Shift sudah ditutup',
      )
    }

    const cashSales =
      await this.prisma.transaction.aggregate({
        _sum: {
          total: true,
        },

        where: {
          cashierId:
            shift.userId,

          paymentMethod:
            PaymentMethod.CASH,

          status: 'PAID',

          createdAt: {
            gte:
              shift.createdAt,
          },
        },
      })

    const totalCashSales =
      cashSales._sum.total ?? 0

    const expectedCash =
      shift.openingCash +
      totalCashSales

    const difference =
      closingCash -
      expectedCash

    const updatedShift =
      await this.prisma.shift.update({
        where: {
          id: shiftId,
        },

        data: {
          status:
            ShiftStatus.CLOSED,

          closingCash,
        },
      })

    return {
      shift:
        updatedShift,

      summary: {
        openingCash:
          shift.openingCash,

        cashSales:
          totalCashSales,

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
        user: true,
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
    const shift =
      await this.prisma.shift.findUnique({
        where: {
          id,
        },

        include: {
          user: true,
          store: true,
        },
      })

    if (!shift) {
      throw new NotFoundException(
        'Shift tidak ditemukan',
      )
    }

    return shift
  }
}