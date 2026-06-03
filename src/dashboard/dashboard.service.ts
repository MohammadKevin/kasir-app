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

  async overview(
    storeId: string,
  ) {
    const startToday =
      new Date()

    startToday.setHours(
      0,
      0,
      0,
      0,
    )

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
            total: true,
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
            total: true,
          },

          where: {
            storeId,

            createdAt: {
              gte:
                startToday,
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

              status:
                TransactionStatus.PAID,

              createdAt: {
                gte:
                  startToday,
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
          .quantity ?? 0,

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

        take: 10,
      })

    const result =
      await Promise.all(
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
              productId:
                item.productId,

              name:
                product?.name,

              sold:
                item._sum
                  .quantity,
            }
          },
        ),
      )

    return result
  }

  async lowStock(
    storeId: string,
  ) {
    return this.prisma.product.findMany({
      where: {
        storeId,

        stock: {
          lte: 5,
        },

        deletedAt:
          null,
      },

      orderBy: {
        stock:
          'asc',
      },
    })
  }
}