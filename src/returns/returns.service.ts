import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateReturnDto,
    userId: string,
  ) {
    const sale =
      await this.prisma.sale.findUnique({
        where: {
          id: dto.saleId,
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
        'Transaction sudah dibatalkan',
      );
    }

    let totalRefund = 0;

    for (const item of dto.items) {
      const saleItem = sale.items.find(
        (i) =>
          i.productId === item.productId,
      );

      if (!saleItem) {
        throw new BadRequestException(
          'Product tidak ditemukan di transaction',
        );
      }

      if (item.quantity > saleItem.quantity) {
        throw new BadRequestException(
          'Quantity return melebihi pembelian',
        );
      }

      totalRefund += item.subtotal;
    }

    const returnTransaction =
      await this.prisma.$transaction(
        async (prisma) => {
          const createdReturn =
            await prisma.returnTransaction.create(
              {
                data: {
                  saleId: dto.saleId,

                  reason: dto.reason,

                  totalRefund,

                  items: {
                    create: dto.items.map(
                      (item) => ({
                        productId:
                          item.productId,

                        quantity:
                          item.quantity,

                        subtotal:
                          item.subtotal,
                      }),
                    ),
                  },
                },

                include: {
                  items: true,
                },
              },
            );

          for (const item of dto.items) {
            const product =
              await prisma.product.findUnique(
                {
                  where: {
                    id: item.productId,
                  },
                },
              );

            if (!product) continue;

            const beforeStock =
              product.stock;

            const afterStock =
              beforeStock +
              item.quantity;

            await prisma.product.update({
              where: {
                id: item.productId,
              },

              data: {
                stock: {
                  increment:
                    item.quantity,
                },
              },
            });

            await prisma.stockMovement.create({
              data: {
                productId:
                  item.productId,

                type: 'RETURN',

                quantity:
                  item.quantity,

                beforeStock,

                afterStock,

                note: `Return transaction ${sale.invoiceNumber}`,

                createdById:
                  userId,
              },
            });
          }

          await prisma.transactionHistory.create(
            {
              data: {
                saleId: sale.id,

                action:
                  'RETURN_TRANSACTION',

                description:
                  dto.reason ||
                  'Return transaction',

                createdById:
                  userId,
              },
            },
          );

          await prisma.activityLog.create({
            data: {
              userId,

              action: 'RETURN',

              entity: 'SALE',

              entityId: sale.id,

              description: `Return transaction ${sale.invoiceNumber}`,
            },
          });

          return createdReturn;
        },
      );

    return {
      message:
        'Return berhasil dibuat',

      data: returnTransaction,
    };
  }

  async findAll() {
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

  async findOne(id: string) {
    const data =
      await this.prisma.returnTransaction.findUnique(
        {
          where: {
            id,
          },

          include: {
            sale: true,

            items: {
              include: {
                product: true,
              },
            },
          },
        },
      );

    if (!data) {
      throw new NotFoundException(
        'Return tidak ditemukan',
      );
    }

    return data;
  }
}