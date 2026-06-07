import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  Prisma,
  TransactionStatus,
} from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(
    dto: CreateTransactionDto,
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

    const cashier =
      await this.prisma.user.findUnique({
        where: {
          id: dto.cashierId,
        },
      })

    if (!cashier) {
      throw new NotFoundException(
        'Cashier tidak ditemukan',
      )
    }

    let customerId =
      dto.customerId ?? null

    if (
      !customerId &&
      dto.phone
    ) {
      let customer =
        await this.prisma.customer.findFirst({
          where: {
            storeId:
              dto.storeId,

            phone:
              dto.phone,
          },
        })

      if (
        !customer &&
        dto.saveCustomer
      ) {
        customer =
          await this.prisma.customer.create({
            data: {
              storeId:
                dto.storeId,

              name:
                dto.customerName ??
                'Customer',

              phone:
                dto.phone,
            },
          })
      }

      customerId =
        customer?.id ?? null
    }

    const invoiceNumber =
      `INV-${Date.now()}`

    let subtotal = 0
    let totalDiscount = 0

    const itemsData: Prisma.TransactionItemCreateManyTransactionInput[] =
      []

    for (const item of dto.items) {
      const product =
        await this.prisma.product.findUnique({
          where: {
            id:
              item.productId,
          },
        })

      if (!product) {
        throw new NotFoundException(
          `Produk ${item.productId} tidak ditemukan`,
        )
      }

      if (
        product.stock <
        item.quantity
      ) {
        throw new BadRequestException(
          `${product.name} stok tidak cukup`,
        )
      }

      let masterDiscount = 0

      const activeDiscount =
        await this.prisma.discountProduct.findFirst({
          where: {
            productId:
              product.id,
            discount: {
              is: {
                isActive: true,
              },
            },
          },
          include: {
            discount: true,
          },
        })

      if (
        activeDiscount && activeDiscount.discount
      ) {
        if (
          activeDiscount
            .discount
            .type ===
          'PERCENTAGE'
        ) {
          masterDiscount =
            Math.floor(
              (product.sellingPrice *
                activeDiscount
                  .discount
                  .value) /
              100,
            )
        } else {
          masterDiscount =
            activeDiscount
              .discount
              .value
        }
      }

      const cashierDiscount =
        item.cashierDiscount ??
        0

      const finalPrice =
        product.sellingPrice -
        masterDiscount -
        cashierDiscount

      if (
        finalPrice < 0
      ) {
        throw new BadRequestException(
          `${product.name} harga akhir tidak valid`,
        )
      }

      const itemSubtotal =
        finalPrice *
        item.quantity

      subtotal +=
        itemSubtotal

      totalDiscount +=
        (masterDiscount +
          cashierDiscount) *
        item.quantity

      itemsData.push({
        productId:
          product.id,

        quantity:
          item.quantity,

        originalPrice:
          product.sellingPrice,

        masterDiscount,

        cashierDiscount,

        finalPrice,

        subtotal:
          itemSubtotal,
      })
    }

    const total =
      subtotal

    if (
      dto.paidAmount <
      total
    ) {
      throw new BadRequestException(
        'Uang pembayaran kurang',
      )
    }

    const changeAmount =
      dto.paidAmount -
      total

    const transaction =
      await this.prisma.transaction.create({
        data: {
          invoiceNumber,

          subtotal,

          totalDiscount,

          total,

          paidAmount:
            dto.paidAmount,

          changeAmount,

          paymentMethod:
            dto.paymentMethod,

          storeId:
            dto.storeId,

          cashierId:
            dto.cashierId,

          customerId,

          items: {
            createMany: {
              data:
                itemsData,
            },
          },
        },

        include: {
          cashier:
            true,

          customer:
            true,

          items:
            true,
        },
      })

    for (const item of dto.items) {
      await this.prisma.product.update({
        where: {
          id:
            item.productId,
        },

        data: {
          stock: {
            decrement:
              item.quantity,
          },
        },
      })
    }

    return transaction
  }

  async findAll(
    storeId: string,
  ) {
    return this.prisma.transaction.findMany({
      where: {
        storeId,
      },

      include: {
        cashier:
          true,

        customer:
          true,
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
    const transaction =
      await this.prisma.transaction.findUnique({
        where: {
          id,
        },

        include: {
          cashier:
            true,

          customer:
            true,

          items: {
            include: {
              product:
                true,
            },
          },
        },
      })

    if (!transaction) {
      throw new NotFoundException(
        'Transaksi tidak ditemukan',
      )
    }

    return transaction
  }

  async void(
    id: string,
    reason: string,
  ) {
    const transaction =
      await this.findOne(id)

    if (
      transaction.status ===
      TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Transaksi sudah dibatalkan',
      )
    }

    for (const item of transaction.items) {
      await this.prisma.product.update({
        where: {
          id:
            item.productId,
        },

        data: {
          stock: {
            increment:
              item.quantity,
          },
        },
      })
    }

    return this.prisma.transaction.update({
      where: {
        id,
      },

      data: {
        status:
          TransactionStatus.CANCELLED,

        voidReason:
          reason,
      },
    })
  }

  async receipt(
    id: string,
  ) {
    const trx =
      await this.prisma.transaction.findUnique({
        where: {
          id,
        },

        include: {
          cashier: true,

          customer: true,

          store: true,

          items: {
            include: {
              product: true,
            },
          },
        },
      })

    if (!trx) {
      throw new NotFoundException(
        'Transaksi tidak ditemukan',
      )
    }

    return {
      store:
        trx.store.name,

      invoice:
        trx.invoiceNumber,

      cashier:
        trx.cashier.name,

      customer:
        trx.customer?.name ??
        '-',

      items:
        trx.items.map(
          (
            item,
          ) => ({
            product:
              item.product
                .name,

            quantity:
              item.quantity,

            price:
              item.finalPrice,

            subtotal:
              item.subtotal,
          }),
        ),

      subtotal:
        trx.subtotal,

      discount:
        trx.totalDiscount,

      total:
        trx.total,

      paidAmount:
        trx.paidAmount,

      changeAmount:
        trx.changeAmount,

      createdAt:
        trx.createdAt,
    }
  }
}