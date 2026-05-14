import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const totalSales = await this.prisma.sale.aggregate({
      _sum: {
        totalAmount: true,
      },
    });

    const totalProfit = await this.prisma.sale.aggregate({
      _sum: {
        totalProfit: true,
      },
    });

    const totalExpense = await this.prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
    });

    const totalProducts = await this.prisma.product.count();

    const totalTransactions = await this.prisma.sale.count();

    const totalCategories = await this.prisma.category.count();

    const totalOutlets = await this.prisma.outlet.count();

    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const todaySales = await this.prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },

      _sum: {
        totalAmount: true,
      },
    });

    const recentTransactions = await this.prisma.sale.findMany({
      take: 5,

      include: {
        cashier: true,
        outlet: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },

      orderBy: {
        stock: 'asc',
      },
    });

    const netProfit =
      (totalProfit._sum.totalProfit || 0) - (totalExpense._sum.amount || 0);

    return {
      statistics: {
        totalSales: totalSales._sum.totalAmount || 0,

        totalProfit: totalProfit._sum.totalProfit || 0,

        totalExpense: totalExpense._sum.amount || 0,

        netProfit,

        totalProducts,

        totalTransactions,

        totalCategories,

        totalOutlets,

        todaySales: todaySales._sum.totalAmount || 0,
      },

      recentTransactions,

      lowStockProducts,
    };
  }
}
