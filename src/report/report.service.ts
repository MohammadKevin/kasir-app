import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async salesReport(startDate?: string, endDate?: string, outletId?: string) {
    const where: any = {};

    if (startDate && endDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (outletId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.outletId = outletId;
    }

    const sales = await this.prisma.sale.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,

      include: {
        outlet: true,

        cashier: true,

        items: {
          include: {
            product: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalSales = sales.reduce((acc, item) => acc + item.totalAmount, 0);

    const totalProfit = sales.reduce((acc, item) => acc + item.totalProfit, 0);

    return {
      totalTransactions: sales.length,

      totalSales,

      totalProfit,

      sales,
    };
  }

  async expenseReport(startDate?: string, endDate?: string, outletId?: string) {
    const where: any = {};

    if (startDate && endDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (outletId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.outletId = outletId;
    }

    const expenses = await this.prisma.expense.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,

      include: {
        outlet: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalExpense = expenses.reduce((acc, item) => acc + item.amount, 0);

    return {
      totalExpense,
      totalData: expenses.length,
      expenses,
    };
  }

  async profitLossReport(
    startDate?: string,
    endDate?: string,
    outletId?: string,
  ) {
    const salesReport = await this.salesReport(startDate, endDate, outletId);

    const expenseReport = await this.expenseReport(
      startDate,
      endDate,
      outletId,
    );

    const netProfit = salesReport.totalProfit - expenseReport.totalExpense;

    return {
      totalSales: salesReport.totalSales,

      totalProfit: salesReport.totalProfit,

      totalExpense: expenseReport.totalExpense,

      netProfit,
    };
  }

  async transactionDetail(id: string) {
    const transaction = await this.prisma.sale.findUnique({
      where: {
        id,
      },

      include: {
        outlet: true,

        cashier: true,

        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction tidak ditemukan');
    }

    return transaction;
  }
}
