import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SaleService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(
    dto: CreateSaleDto,
  ) {
    const outlet =
      await this.prisma.outlet.findUnique({
        where: {
          id: dto.outletId,
        },
      });

    if (!outlet) {
      throw new NotFoundException(
        'Outlet tidak ditemukan',
      );
    }

    const cashier =
      await this.prisma.cashier.findUnique({
        where: {
          id: dto.cashierId,
        },
      });

    if (!cashier) {
      throw new NotFoundException(
        'Cashier tidak ditemukan',
      );
    }

    const appSetting =
      await this.prisma.appSetting.findFirst();

    let subtotalAmount = 0;

    let totalProfit = 0;

    const saleItems: {
      productId: string;
      quantity: number;
      costPrice: number;
      sellingPrice: number;
      subtotal: number;
      profit: number;
    }[] = [];

    const productSnapshots: {
      id: string;
      stock: number;
      quantity: number;
    }[] = [];

    for (const item of dto.items) {
      const product =
        await this.prisma.product.findUnique({
          where: {
            id: item.productId,
          },
        });

      if (!product) {
        throw new NotFoundException(
          'Product tidak ditemukan',
        );
      }

      if (
        product.stock <
        item.quantity
      ) {
        throw new BadRequestException(
          `Stock product ${product.name} tidak cukup`,
        );
      }

      const subtotal =
        product.sellingPrice *
        item.quantity;

      const profit =
        (product.sellingPrice -
          product.costPrice) *
        item.quantity;

      subtotalAmount += subtotal;

      totalProfit += profit;

      saleItems.push({
        productId: product.id,

        quantity: item.quantity,

        costPrice:
          product.costPrice,

        sellingPrice:
          product.sellingPrice,

        subtotal,

        profit,
      });

      productSnapshots.push({
        id: product.id,

        stock: product.stock,

        quantity:
          item.quantity,
      });
    }

    let discountAmount = 0;

    if (
      dto.discountType ===
      'PERCENTAGE'
    ) {
      discountAmount =
        (subtotalAmount *
          (dto.discountValue ||
            0)) /
        100;
    }

    if (
      dto.discountType ===
      'FIXED'
    ) {
      discountAmount =
        dto.discountValue || 0;
    }

    const taxPercentage =
      appSetting?.taxPercentage ||
      0;

    const afterDiscount =
      subtotalAmount -
      discountAmount;

    const taxAmount =
      (afterDiscount *
        taxPercentage) /
      100;

    const totalAmount =
      afterDiscount +
      taxAmount;

    if (
      dto.paymentMethod ===
      'CASH'
    ) {
      if (
        !dto.paidAmount ||
        dto.paidAmount <
          totalAmount
      ) {
        throw new BadRequestException(
          'Uang pembayaran kurang',
        );
      }
    }

    const totalSalesToday =
      await this.prisma.sale.count(
        {
          where: {
            createdAt: {
              gte: new Date(
                new Date().setHours(
                  0,
                  0,
                  0,
                  0,
                ),
              ),
            },
          },
        },
      );

    const invoiceNumber = `INV-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(
        /-/g,
        '',
      )}-${String(
      totalSalesToday + 1,
    ).padStart(4, '0')}`;

    const sale =
      await this.prisma.$transaction(
        async (prisma) => {
          const createdSale =
            await prisma.sale.create(
              {
                data: {
                  invoiceNumber,

                  subtotalAmount,

                  discountId:
                    dto.discountId,

                  discountType:
                    dto.discountType,

                  discountValue:
                    dto.discountValue ||
                    0,

                  discountAmount,

                  taxAmount,

                  totalAmount,

                  totalProfit,

                  paymentMethod:
                    dto.paymentMethod,

                  paymentStatus:
                    dto.paymentMethod ===
                    'CASH'
                      ? 'PAID'
                      : 'PENDING',

                  paidAmount:
                    dto.paidAmount,

                  changeAmount:
                    dto.paidAmount
                      ? dto.paidAmount -
                        totalAmount
                      : 0,

                  paymentProof:
                    dto.paymentProof,

                  notes:
                    dto.notes,

                  customerId:
                    dto.customerId,

                  outletId:
                    dto.outletId,

                  cashierId:
                    dto.cashierId,

                  items: {
                    create:
                      saleItems,
                  },
                },

                include: {
                  items: true,

                  customer: true,

                  cashier: true,
                },
              },
            );

          await prisma.salePayment.create(
            {
              data: {
                saleId:
                  createdSale.id,

                method:
                  dto.paymentMethod,

                amount:
                  totalAmount,
              },
            },
          );

          for (const item of dto.items) {
            const snapshot =
              productSnapshots.find(
                (p) =>
                  p.id ===
                  item.productId,
              );

            if (!snapshot)
              continue;

            const beforeStock =
              snapshot.stock;

            const afterStock =
              beforeStock -
              item.quantity;

            await prisma.product.update(
              {
                where: {
                  id: item.productId,
                },

                data: {
                  stock: {
                    decrement:
                      item.quantity,
                  },
                },
              },
            );

            await prisma.stockMovement.create(
              {
                data: {
                  productId:
                    item.productId,

                  type: 'SALE',

                  quantity:
                    item.quantity,

                  beforeStock,

                  afterStock,

                  note: `Sale ${invoiceNumber}`,
                },
              },
            );
          }

          await prisma.transactionHistory.create(
            {
              data: {
                saleId:
                  createdSale.id,

                action:
                  'CREATE_SALE',

                description: `Transaction ${invoiceNumber} created`,
              },
            },
          );

          if (dto.cartId) {
            await prisma.cart.update(
              {
                where: {
                  id: dto.cartId,
                },

                data: {
                  status:
                    'COMPLETED',

                  completedAt:
                    new Date(),
                },
              },
            );
          }

          if (dto.customerId) {
            const points =
              Math.floor(
                totalAmount /
                  10000,
              );

            await prisma.customer.update(
              {
                where: {
                  id: dto.customerId,
                },

                data: {
                  points: {
                    increment:
                      points,
                  },
                },
              },
            );
          }

          return createdSale;
        },
      );

    return {
      message:
        'Transaction berhasil',

      data: sale,
    };
  }

  async findAll() {
    return this.prisma.sale.findMany({
      include: {
        outlet: true,

        cashier: true,

        customer: true,

        payments: true,

        histories: true,

        discount: true,

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
  }

  async findOne(id: string) {
    const sale =
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

          discount: true,

          items: {
            include: {
              product: true,
            },
          },
        },
      });

    if (!sale) {
      throw new NotFoundException(
        'Transaction tidak ditemukan',
      );
    }

    return sale;
  }

  async cancelSale(
    saleId: string,
    userId: string,
    reason: string,
  ) {
    const sale =
      await this.prisma.sale.findUnique({
        where: {
          id: saleId,
        },

        include: {
          items: true,
        },
      });

    if (!sale) {
      throw new NotFoundException(
        'Transaction tidak ditemukan',
      );
    }

    if (
      sale.paymentStatus ===
      'CANCELLED'
    ) {
      throw new BadRequestException(
        'Transaction sudah dicancel',
      );
    }

    await this.prisma.$transaction(
      async (prisma) => {
        for (const item of sale.items) {
          const product =
            await prisma.product.findUnique(
              {
                where: {
                  id: item.productId,
                },
              },
            );

          if (!product)
            continue;

          const beforeStock =
            product.stock;

          const afterStock =
            beforeStock +
            item.quantity;

          await prisma.product.update(
            {
              where: {
                id: item.productId,
              },

              data: {
                stock: {
                  increment:
                    item.quantity,
                },
              },
            },
          );

          await prisma.stockMovement.create(
            {
              data: {
                productId:
                  item.productId,

                type:
                  'CANCEL',

                quantity:
                  item.quantity,

                beforeStock,

                afterStock,

                note: `Cancel transaction ${sale.invoiceNumber}`,

                createdById:
                  userId,
              },
            },
          );
        }

        await prisma.sale.update({
          where: {
            id: saleId,
          },

          data: {
            paymentStatus:
              'CANCELLED',

            cancelledAt:
              new Date(),

            cancelReason:
              reason,

            cancelledById:
              userId,
          },
        });

        await prisma.transactionHistory.create(
          {
            data: {
              saleId,

              action:
                'CANCEL_SALE',

              description:
                reason,

              createdById:
                userId,
            },
          },
        );

        await prisma.activityLog.create(
          {
            data: {
              userId,

              action:
                'CANCEL',

              entity:
                'SALE',

              entityId:
                saleId,

              description: `Cancel sale ${sale.invoiceNumber}`,
            },
          },
        );
      },
    );

    return {
      message:
        'Transaction berhasil dicancel',
    };
  }
}