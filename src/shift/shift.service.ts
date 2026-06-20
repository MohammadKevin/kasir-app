import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ShiftStatus, TransactionStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { OpenShiftDto } from './dto/open-shift.dto';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async open(userId: string, dto: OpenShiftDto) {
    console.log({
      userId,
      dto,
    });

    const store = await this.prisma.store.findUnique({
      where: {
        id: dto.storeId,
      },
    });

    console.log('STORE', store);

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    console.log('USER', user);

    if (!store) {
      throw new NotFoundException('Store tidak ditemukan');
    }

    if (!user) {
      throw new NotFoundException(`Kasir tidak ditemukan: ${userId}`);
    }

    return this.prisma.shift.create({
      data: {
        storeId: dto.storeId,
        userId,
        openingCash: Number(dto.openingCash),
        status: ShiftStatus.OPEN,
      },

      include: {
        user: true,
      },
    });
  }

  async close(id: string, closingCash: number) {
    const shift = await this.prisma.shift.findUnique({
      where: {
        id,
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan');
    }

    if (shift.status === ShiftStatus.CLOSED) {
      throw new ConflictException('Shift already sudah ditutup');
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        storeId: shift.storeId,
        cashierId: shift.userId,
        status: TransactionStatus.PAID,
        createdAt: {
          gte: shift.createdAt,
        },
      },
    });

    let cashSales = 0;
    let qrisSales = 0;
    let debitSales = 0;
    let transferSales = 0;
    let creditSales = 0;

    for (const tx of transactions) {
      if (tx.paymentMethod === 'SPLIT' && tx.splitPayments) {
        let split: any = {};
        try {
          split =
            typeof tx.splitPayments === 'string'
              ? JSON.parse(tx.splitPayments)
              : tx.splitPayments;
        } catch (e) {
          console.error('Error parsing splitPayments:', e);
        }
        if (split) {
          if (split.CASH) cashSales += Number(split.CASH);
          if (split.QRIS) qrisSales += Number(split.QRIS);
          if (split.DEBIT) debitSales += Number(split.DEBIT);
        }
      } else {
        const amount = Number(tx.total || 0);
        if (tx.paymentMethod === 'CASH') cashSales += amount;
        else if (tx.paymentMethod === 'QRIS') qrisSales += amount;
        else if (tx.paymentMethod === 'DEBIT') debitSales += amount;
        else if (tx.paymentMethod === 'TRANSFER') transferSales += amount;
        else if (tx.paymentMethod === 'CREDIT') creditSales += amount;
      }
    }

    const expectedCash = Number(shift.openingCash) + cashSales;

    const difference = Number(closingCash) - expectedCash;

    // Auto Clock-Out if clocked in
    const activeAttendance = await this.prisma.attendance.findFirst({
      where: {
        userId: shift.userId,
        clockOut: null,
      },
      orderBy: {
        clockIn: 'desc',
      },
    });

    if (activeAttendance) {
      await this.prisma.attendance.update({
        where: { id: activeAttendance.id },
        data: {
          clockOut: new Date(),
        },
      });
    }

    const updated = await this.prisma.shift.update({
      where: {
        id,
      },

      data: {
        closingCash: Number(closingCash),

        expectedCash: Number(expectedCash),

        difference: Number(difference),

        closedAt: new Date(),

        status: ShiftStatus.CLOSED,
      },

      include: {
        user: true,
      },
    });

    return {
      shift: updated,

      summary: {
        openingCash: shift.openingCash,

        cashSales,
        qrisSales,
        debitSales,
        transferSales,
        creditSales,

        expectedCash,

        closingCash,

        difference,
      },
    };
  }

  async findAll(storeId: string) {
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
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.shift.findUnique({
      where: {
        id,
      },

      include: {
        user: true,
      },
    });
  }
}
