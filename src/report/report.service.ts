import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async salesReport(
    startDate?: string,
    endDate?: string,
    outletId?: string,
  ) {
    const where: any = {
      paymentStatus: {
        not: 'CANCELLED',
      },
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),

        lte: new Date(
          new Date(endDate).setHours(
            23,
            59,
            59,
            999,
          ),
        ),
      };
    }

    if (outletId) {
      where.outletId = outletId;
    }

    const sales =
      await this.prisma.sale.findMany({
        where,

        include: {
          outlet: true,

          cashier: true,

          customer: true,

          payments: true,

          histories: true,

          returns: true,

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

    const totalSales = sales.reduce(
      (acc, item) =>
        acc + item.totalAmount,
      0,
    );

    const totalProfit = sales.reduce(
      (acc, item) =>
        acc + item.totalProfit,
      0,
    );

    return {
      totalTransactions:
        sales.length,

      totalSales,

      totalProfit,

      sales,
    };
  }

  async expenseReport(
    startDate?: string,
    endDate?: string,
    outletId?: string,
  ) {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),

        lte: new Date(
          new Date(endDate).setHours(
            23,
            59,
            59,
            999,
          ),
        ),
      };
    }

    if (outletId) {
      where.outletId = outletId;
    }

    const expenses =
      await this.prisma.expense.findMany({
        where,

        include: {
          outlet: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    const totalExpense =
      expenses.reduce(
        (acc, item) =>
          acc + item.amount,
        0,
      );

    return {
      totalExpense,

      totalData:
        expenses.length,

      expenses,
    };
  }

  async profitLossReport(
    startDate?: string,
    endDate?: string,
    outletId?: string,
  ) {
    const salesReport =
      await this.salesReport(
        startDate,
        endDate,
        outletId,
      );

    const expenseReport =
      await this.expenseReport(
        startDate,
        endDate,
        outletId,
      );

    const netProfit =
      salesReport.totalProfit -
      expenseReport.totalExpense;

    return {
      totalSales:
        salesReport.totalSales,

      totalProfit:
        salesReport.totalProfit,

      totalExpense:
        expenseReport.totalExpense,

      netProfit,
    };
  }

  async transactionDetail(id: string) {
    const transaction =
      await this.prisma.sale.findUnique({
        where: {
          id,
        },

        include: {
          outlet: true,

          cashier: true,

          customer: true,

          payments: true,

          histories: true,

          returns: true,

          items: {
            include: {
              product: true,
            },
          },
        },
      });

    if (!transaction) {
      throw new NotFoundException(
        'Transaction tidak ditemukan',
      );
    }

    return transaction;
  }

  async dashboardSummary() {
    const [
      totalProducts,
      totalCustomers,
      totalTransactions,
      products,
      sales,
      expenses,
    ] = await Promise.all([
      this.prisma.product.count({
        where: {
          isActive: true,
        },
      }),

      this.prisma.customer.count(),

      this.prisma.sale.count({
        where: {
          paymentStatus: {
            not: 'CANCELLED',
          },
        },
      }),

      this.prisma.product.findMany({
        where: {
          isActive: true,
        },
      }),

      this.prisma.sale.aggregate({
        where: {
          paymentStatus: {
            not: 'CANCELLED',
          },
        },

        _sum: {
          totalAmount: true,
          totalProfit: true,
        },
      }),

      this.prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
      }),
    ]);

    const lowStockProducts =
      products.filter(
        (item) =>
          item.stock <=
          item.minStock,
      );

    return {
      totalProducts,

      totalCustomers,

      totalTransactions,

      totalSales:
        sales._sum.totalAmount ||
        0,

      totalProfit:
        sales._sum.totalProfit ||
        0,

      totalExpense:
        expenses._sum.amount || 0,

      lowStockProducts:
        lowStockProducts.length,
    };
  }

  async topProducts() {
    return this.prisma.saleItem.groupBy({
      by: ['productId'],

      _sum: {
        quantity: true,
        subtotal: true,
      },

      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },

      take: 10,
    });
  }

  async lowStockReport() {
    const products =
      await this.prisma.product.findMany({
        where: {
          isActive: true,
        },

        include: {
          category: true,

          outlet: true,
        },
      });

    return products.filter(
      (item) =>
        item.stock <=
        item.minStock,
    );
  }

  async cashierPerformance() {
    return this.prisma.sale.groupBy({
      by: ['cashierId'],

      where: {
        paymentStatus: {
          not: 'CANCELLED',
        },
      },

      _sum: {
        totalAmount: true,
      },

      _count: true,
    });
  }

  async returnReport() {
    return this.prisma.returnTransaction.findMany(
      {
        include: {
          sale: true,

          items: {
            include: {
              product: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      },
    );
  }

  async dailySalesChart() {
    const sales =
      await this.prisma.sale.findMany({
        where: {
          paymentStatus: {
            not: 'CANCELLED',
          },
        },

        select: {
          totalAmount: true,

          createdAt: true,
        },

        orderBy: {
          createdAt: 'asc',
        },
      });

    const grouped: Record<
      string,
      number
    > = {};

    for (const sale of sales) {
      const date =
        sale.createdAt
          .toISOString()
          .split('T')[0];

      grouped[date] =
        (grouped[date] || 0) +
        sale.totalAmount;
    }

    return Object.entries(grouped).map(
      ([date, total]) => ({
        date,
        total,
      }),
    );
  }

  async monthlySalesChart() {
    const sales =
      await this.prisma.sale.findMany({
        where: {
          paymentStatus: {
            not: 'CANCELLED',
          },
        },

        select: {
          totalAmount: true,

          createdAt: true,
        },
      });

    const grouped: Record<
      string,
      number
    > = {};

    for (const sale of sales) {
      const date =
        sale.createdAt;

      const month = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;

      grouped[month] =
        (grouped[month] || 0) +
        sale.totalAmount;
    }

    return Object.entries(grouped).map(
      ([month, total]) => ({
        month,
        total,
      }),
    );
  }
}
