import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

@Injectable()
export class CashierShiftsService {
  constructor(private prisma: PrismaService) {}

  async openShift(
    cashierId: string,
    outletId: string,
    dto: OpenShiftDto,
  ) {
    const existingShift = await this.prisma.cashierShift.findFirst({
      where: {
        cashierId,
        status: 'OPEN',
      },
    });

    if (existingShift) {
      throw new BadRequestException(
        'Masih ada shift yang belum ditutup',
      );
    }

    return this.prisma.cashierShift.create({
      data: {
        cashierId,
        outletId,
        startCash: dto.startCash,
      },
    });
  }

  async closeShift(
    shiftId: string,
    dto: CloseShiftDto,
  ) {
    const shift = await this.prisma.cashierShift.findUnique({
      where: {
        id: shiftId,
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan');
    }

    if (shift.status === 'CLOSED') {
      throw new BadRequestException(
        'Shift sudah ditutup',
      );
    }

    const sales = await this.prisma.sale.aggregate({
      where: {
        cashierId: shift.cashierId,
        createdAt: {
          gte: shift.openedAt,
        },
        paymentStatus: 'PAID',
      },

      _sum: {
        totalAmount: true,
      },
    });

    return this.prisma.cashierShift.update({
      where: {
        id: shiftId,
      },

      data: {
        endCash: dto.endCash,
        totalSales: sales._sum.totalAmount || 0,
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.cashierShift.findMany({
      include: {
        cashier: true,
        outlet: true,
      },

      orderBy: {
        openedAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.cashierShift.findUnique({
      where: {
        id,
      },

      include: {
        cashier: true,
        outlet: true,
      },
    });

    if (!shift) {
      throw new NotFoundException(
        'Shift tidak ditemukan',
      );
    }

    return shift;
  }

  async getActiveShift(cashierId: string) {
    return this.prisma.cashierShift.findFirst({
      where: {
        cashierId,
        status: 'OPEN',
      },

      include: {
        cashier: true,
        outlet: true,
      },
    });
  }
}