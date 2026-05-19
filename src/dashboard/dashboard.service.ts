// dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getDashboard() {
    const todayStart = new Date();

    todayStart.setHours(
      0,
      0,
      0,
      0,
    );

    const [
      sales,
      expenses,
      totalProducts,
      totalTransactions,
      totalCategories,
      totalOutlets,
      totalCustomers,
      products,
      todaySales,
      recentTransactions,
      topProducts,
    ] = await Promise.all([
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

      this.prisma.product.count({
        where: {
          isActive: true,
        },
      }),

      this.prisma.sale.count({
        where: {
          paymentStatus: {
            not: 'CANCELLED',
          },
        },
      }),

      this.prisma.category.count(),

      this.prisma.outlet.count(),

      this.prisma.customer.count(),

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

          createdAt: {
            gte: todayStart,
          },
        },

        _sum: {
          totalAmount: true,
        },
      }),

      this.prisma.sale.findMany({
        take: 5,

        where: {
          paymentStatus: {
            not: 'CANCELLED',
          },
        },

        include: {
          cashier: true,

          outlet: true,

          customer: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.saleItem.groupBy({
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

        take: 5,
      }),
    ]);

    const lowStockProducts =
      products.filter(
        (item) =>
          item.stock <=
          item.minStock,
      );

    const netProfit =
      (sales._sum.totalProfit || 0) -
      (expenses._sum.amount || 0);

    return {
      statistics: {
        totalSales:
          sales._sum.totalAmount || 0,

        totalProfit:
          sales._sum.totalProfit || 0,

        totalExpense:
          expenses._sum.amount || 0,

        netProfit,

        totalProducts,

        totalTransactions,

        totalCategories,

        totalOutlets,

        totalCustomers,

        lowStockProducts:
          lowStockProducts.length,

        todaySales:
          todaySales._sum.totalAmount ||
          0,
      },

      recentTransactions,

      lowStockProducts,

      topProducts,
    };
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
