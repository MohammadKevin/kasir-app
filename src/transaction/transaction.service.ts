import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, TransactionStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  private generateInvoiceNumber(storeId: string): string {
    const storeCode = storeId.slice(0, 4).toUpperCase();
    const timeCode = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 900 + 100);
    return `INV-${storeCode}-${timeCode}${random}`;
  }

  async create(dto: CreateTransactionDto) {
    return await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.findUnique({ where: { id: dto.storeId } });
      if (!store) throw new NotFoundException('Store  tidak ditemukan');

      const cashier = await tx.user.findUnique({
        where: { id: dto.cashierId },
      });
      if (!cashier) throw new NotFoundException('Cashier tidak ditemukan');

      let customerId = dto.customerId ?? null;
      if (!customerId && dto.phone) {
        let customer = await tx.customer.findFirst({
          where: { storeId: dto.storeId, phone: dto.phone },
        });
        if (!customer && dto.saveCustomer) {
          customer = await tx.customer.create({
            data: {
              storeId: dto.storeId,
              name: dto.customerName ?? 'Customer',
              phone: dto.phone,
            },
          });
        }
        customerId = customer?.id ?? null;
      }

      const itemsData: Prisma.TransactionItemCreateManyTransactionInput[] = [];
      let subtotal = 0;
      let totalDiscount = 0;

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `Produk ${product?.name || item.productId} tidak tersedia`,
          );
        }

        // Deduct ingredient stock based on product recipe (BOM)
        const recipe = await tx.productIngredient.findMany({
          where: { productId: product.id },
          include: { ingredient: true },
        });

        for (const recipeItem of recipe) {
          const requiredQty = recipeItem.quantity * item.quantity;
          if (recipeItem.ingredient.stock < requiredQty) {
            throw new BadRequestException(
              `Bahan baku ${recipeItem.ingredient.name} tidak cukup untuk membuat ${product.name}`,
            );
          }
          await tx.ingredient.update({
            where: { id: recipeItem.ingredientId },
            data: { stock: { decrement: requiredQty } },
          });
        }

        const activeDiscount = await tx.discountProduct.findFirst({
          where: {
            productId: product.id,
            discount: { is: { isActive: true } },
          },
          include: { discount: true },
        });

        let masterDiscount = 0;
        if (activeDiscount?.discount) {
          masterDiscount =
            activeDiscount.discount.type === 'PERCENTAGE'
              ? Math.floor(
                  (product.sellingPrice * activeDiscount.discount.value) / 100,
                )
              : activeDiscount.discount.value;
        }

        const cashierDiscount = Math.floor(item.cashierDiscount ?? 0);
        const finalPrice =
          product.sellingPrice - masterDiscount - cashierDiscount;

        if (finalPrice < 0)
          throw new BadRequestException(`${product.name} harga tidak valid`);

        subtotal += product.sellingPrice * item.quantity;
        totalDiscount += (masterDiscount + cashierDiscount) * item.quantity;

        itemsData.push({
          productId: product.id,
          quantity: item.quantity,
          originalPrice: product.sellingPrice,
          masterDiscount,
          cashierDiscount,
          finalPrice,
          subtotal: finalPrice * item.quantity,
        });

        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });

        if (
          updatedProduct.isActive &&
          updatedProduct.stock <= updatedProduct.minimumStock
        ) {
          await tx.notification
            .create({
              data: {
                userId: dto.storeId,
                userType: 'STORE',
                title: 'Stok Menipis',
                content: `Stok produk ${product.name} saat ini tinggal ${updatedProduct.stock} (batas minimum: ${product.minimumStock})`,
                isRead: false,
              },
            })
            .catch((err) => {
              console.warn(
                'Gagal membuat notifikasi stok menipis:',
                err.message,
              );
            });
        }
      }
      const finalSubtotal =
        dto.subtotal !== undefined ? dto.subtotal : subtotal;
      const finalTotalDiscount =
        dto.totalDiscount !== undefined ? dto.totalDiscount : totalDiscount;
      const finalTotal =
        dto.total !== undefined
          ? dto.total
          : finalSubtotal - finalTotalDiscount;
      const changeAmount =
        dto.paymentMethod === 'CASH' || dto.paymentMethod === 'SPLIT'
          ? Math.max(0, dto.paidAmount - finalTotal)
          : 0;

      // Process Customer Loyalty Points
      let pointsEarned = 0;
      let pointsRedeemed = dto.pointsRedeemed ?? 0;
      if (customerId && store.pointsEnabled) {
        if (pointsRedeemed > 0) {
          const customer = await tx.customer.findUnique({
            where: { id: customerId },
          });
          if (!customer || customer.points < pointsRedeemed) {
            throw new BadRequestException(
              'Poin member tidak mencukupi untuk redeem',
            );
          }
          await tx.customer.update({
            where: { id: customerId },
            data: { points: { decrement: pointsRedeemed } },
          });
        }

        // Earn 1 point per 10,000 IDR total spent
        pointsEarned = dto.pointsEarned ?? Math.floor(finalTotal / 10000);
        const updatedCust = await tx.customer.update({
          where: { id: customerId },
          data: { points: { increment: pointsEarned } },
        });

        // Update member tier based on points
        let newTier = 'BRONZE';
        if (updatedCust.points >= 500) newTier = 'GOLD';
        else if (updatedCust.points >= 100) newTier = 'SILVER';

        await tx.customer.update({
          where: { id: customerId },
          data: { memberTier: newTier },
        });
      } else {
        pointsEarned = 0;
        pointsRedeemed = 0;
      }

      // Update table status to AVAILABLE (billing/checkout finished)
      if (dto.orderType === 'DINEIN' && dto.tableId) {
        await tx.table.update({
          where: { id: dto.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      return await tx.transaction.create({
        data: {
          invoiceNumber: this.generateInvoiceNumber(dto.storeId),
          subtotal: finalSubtotal,
          totalDiscount: finalTotalDiscount,
          total: finalTotal,
          paidAmount: dto.paidAmount,
          changeAmount,
          paymentMethod: dto.paymentMethod,
          storeId: dto.storeId,
          cashierId: dto.cashierId,
          customerId,
          orderType: dto.orderType ?? 'TAKEAWAY',
          tableId: dto.tableId ?? null,
          taxAmount: dto.taxAmount ?? 0,
          serviceAmount: dto.serviceAmount ?? 0,
          splitPayments: dto.splitPayments ?? null,
          pointsEarned,
          pointsRedeemed,
          items: { createMany: { data: itemsData } },
        },
      });
    });
  }

  async findAll(storeId: string) {
    return this.prisma.transaction.findMany({
      where: {
        storeId,
      },

      include: {
        cashier: true,

        customer: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: {
        id,
      },

      include: {
        cashier: true,

        customer: true,

        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan');
    }

    return transaction;
  }

  async void(id: string, reason: string) {
    const transaction = await this.findOne(id);

    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('Transaksi sudah dibatalkan');
    }

    for (const item of transaction.items) {
      await this.prisma.product.update({
        where: {
          id: item.productId,
        },

        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    return this.prisma.transaction.update({
      where: {
        id,
      },

      data: {
        status: TransactionStatus.CANCELLED,

        voidReason: reason,
      },
    });
  }

  async receipt(id: string) {
    const trx = await this.prisma.transaction.findUnique({
      where: {
        id,
      },

      include: {
        cashier: true,

        customer: true,

        store: true,

        table: true,

        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!trx) {
      throw new NotFoundException('Transaksi tidak ditemukan');
    }

    return {
      store: trx.store.name,

      invoice: trx.invoiceNumber,

      cashier: trx.cashier.name,

      customer: trx.customer?.name ?? '-',

      items: trx.items.map((item) => ({
        product: item.product.name,

        quantity: item.quantity,

        originalPrice: item.originalPrice,

        discount: item.masterDiscount + item.cashierDiscount,

        price: item.finalPrice,

        subtotal: item.subtotal,
      })),

      subtotal: trx.subtotal,

      discount: trx.totalDiscount,

      total: trx.total,

      paidAmount: trx.paidAmount,

      changeAmount: trx.changeAmount,

      orderType: trx.orderType,

      tableNumber: trx.table?.number ?? null,

      taxAmount: trx.taxAmount,

      serviceAmount: trx.serviceAmount,

      splitPayments: trx.splitPayments,

      pointsEarned: trx.pointsEarned,

      pointsRedeemed: trx.pointsRedeemed,

      createdAt: trx.createdAt,
    };
  }
}
