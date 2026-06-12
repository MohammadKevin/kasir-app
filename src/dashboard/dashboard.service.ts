import { Injectable } from '@nestjs/common'

import {
  TransactionStatus,
} from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // DASHBOARD ADMIN
  async adminOverview() {
    const [
      stores,
      cashiers,
      transactions,
      sales,
      expenses,
      recentTransactions,
    ] =
      await Promise.all([

        this.prisma.store.count(),

        this.prisma.cashier.count(),

        this.prisma.transaction.count({
          where: {
            status:
              TransactionStatus.PAID,
          },
        }),

        this.prisma.transaction.aggregate({
          _sum: {
            total:
              true,
          },

          where: {
            status:
              TransactionStatus.PAID,
          },
        }),

        this.prisma.expense.aggregate({
          _sum: {
            amount:
              true,
          },
        }),

        this.prisma.transaction.findMany({
          take: 10,

          orderBy: {
            createdAt:
              'desc',
          },

          include: {
            cashier:
              true,

            store:
              true,
          },
        }),
      ])

    const totalSales =
      sales._sum.total ??
      0

    const totalExpense =
      expenses._sum.amount ??
      0

    return {
      totalStores:
        stores,

      totalCashiers:
        cashiers,

      totalTransactions:
        transactions,

      totalRevenue:
        totalSales,

      totalExpense,

      profit:
        totalSales -
        totalExpense,

      recentTransactions,
    }
  }

  // DASHBOARD STORE
  async overview(
    storeId: string,
  ) {
    const now = new Date()
    const jakartaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    jakartaTime.setUTCHours(0, 0, 0, 0)
    const startToday = new Date(jakartaTime.getTime() - 7 * 60 * 60 * 1000)

    const [
      sales,
      transactions,
      purchases,
      productsSold,
      lowStock,
      customers,
      activeShift,
    ] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          _sum: {
            total:
              true,
          },

          where: {
            storeId,

            status:
              TransactionStatus.PAID,

            createdAt: {
              gte:
                startToday,
            },
          },
        }),

        this.prisma.transaction.count({
          where: {
            storeId,

            status:
              TransactionStatus.PAID,

            createdAt: {
              gte:
                startToday,
            },
          },
        }),

        this.prisma.purchase.aggregate({
          _sum: {
            total:
              true,
          },

          where: {
            storeId,
            createdAt: {
              gte: startToday,
            },
          },
        }),

        this.prisma.transactionItem.aggregate({
          _sum: {
            quantity:
              true,
          },

          where: {
            transaction: {
              storeId,
              status: TransactionStatus.PAID,
              createdAt: {
                gte: startToday,
              },
            },
          },
        }),

        this.prisma.product.count({
          where: {
            storeId,

            stock: {
              lte: 5,
            },

            deletedAt:
              null,
          },
        }),

        this.prisma.customer.count({
          where: {
            storeId,
          },
        }),

        this.prisma.shift.count({
          where: {
            storeId,

            status:
              'OPEN',
          },
        }),
      ])

    return {
      todaySales:
        sales._sum.total ??
        0,

      todayTransactions:
        transactions,

      todayPurchase:
        purchases._sum.total ??
        0,

      todayProductsSold:
        productsSold._sum
          .quantity ??
        0,

      totalCustomers:
        customers,

      lowStockProducts:
        lowStock,

      activeShift,
    }
  }

  async topProducts(
    storeId: string,
  ) {
    const items =
      await this.prisma.transactionItem.groupBy({
        by: [
          'productId',
        ],

        where: {
          transaction: {
            storeId,
          },
        },

        _sum: {
          quantity:
            true,
        },

        orderBy: {
          _sum: {
            quantity:
              'desc',
          },
        },

        take:
          10,
      })

    return Promise.all(
      items.map(
        async (
          item,
        ) => {
          const product =
            await this.prisma.product.findUnique({
              where: {
                id:
                  item.productId,
              },
            })

          return {
            name:
              product?.name,

            sold:
              item._sum
                .quantity,
          }
        },
      ),
    )
  }

  async lowStock(
    storeId: string,
  ) {
    return this.prisma.product.findMany({
      where: {
        storeId,

        stock: {
          lte:
            5,
        },

        deletedAt:
          null,
      },
    })
  }
}