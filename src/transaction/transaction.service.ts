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
  ) {}

  private generateInvoiceNumber(storeId: string): string {
    const storeCode = storeId.slice(0, 4).toUpperCase();
    const timeCode = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 900 + 100);
    return `INV-${storeCode}-${timeCode}${random}`;
  }

  async create(dto: CreateTransactionDto) {
    return await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.findUnique({ where: { id: dto.storeId } });
      if (!store) throw new NotFoundException('Store tidak ditemukan');

      const cashier = await tx.user.findUnique({ where: { id: dto.cashierId } });
      if (!cashier) throw new NotFoundException('Cashier tidak ditemukan');

      let customerId = dto.customerId ?? null;
      if (!customerId && dto.phone) {
        let customer = await tx.customer.findFirst({ where: { storeId: dto.storeId, phone: dto.phone } });
        if (!customer && dto.saveCustomer) {
          customer = await tx.customer.create({ 
            data: { storeId: dto.storeId, name: dto.customerName ?? 'Customer', phone: dto.phone } 
          });
        }
        customerId = customer?.id ?? null;
      }

      const itemsData = [];
      let subtotal = 0;
      let totalDiscount = 0;

      for (const item of dto.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(`Produk ${product?.name || item.productId} tidak tersedia`);
        }

        const activeDiscount = await tx.discountProduct.findFirst({
            where: { productId: product.id, discount: { is: { isActive: true } } },
            include: { discount: true }
        });

        let masterDiscount = 0;
        if (activeDiscount?.discount) {
            masterDiscount = activeDiscount.discount.type === 'PERCENTAGE' 
                ? Math.floor((product.sellingPrice * activeDiscount.discount.value) / 100) 
                : activeDiscount.discount.value;
        }

        const cashierDiscount = Math.floor(item.cashierDiscount ?? 0);
        const finalPrice = product.sellingPrice - masterDiscount - cashierDiscount;
        
        if (finalPrice < 0) throw new BadRequestException(`${product.name} harga tidak valid`);

        subtotal += finalPrice * item.quantity;
        totalDiscount += (masterDiscount + cashierDiscount) * item.quantity;

        const itemsData: Prisma.TransactionItemCreateManyTransactionInput[] = [];

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } }
        });
      }
      return await tx.transaction.create({
        data: {
          invoiceNumber: this.generateInvoiceNumber(dto.storeId),
          subtotal,
          totalDiscount,
          total: subtotal - totalDiscount,
          paidAmount: dto.paidAmount,
          changeAmount: dto.paidAmount - (subtotal - totalDiscount),
          paymentMethod: dto.paymentMethod,
          storeId: dto.storeId,
          cashierId: dto.cashierId,
          customerId,
          items: { createMany: { data: itemsData } }
        }
      });
    });
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