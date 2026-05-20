import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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

          returns: {
            include: {
              items: true,
            },
          },
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
      const saleItem =
        sale.items.find(
          (i) =>
            i.productId ===
            item.productId,
        );

      if (!saleItem) {
        throw new BadRequestException(
          'Product tidak ditemukan di transaction',
        );
      }

      const totalReturned =
        sale.returns
          .flatMap(
            (returnData) =>
              returnData.items,
          )
          .filter(
            (returnItem) =>
              returnItem.productId ===
              item.productId,
          )
          .reduce(
            (total, current) =>
              total +
              current.quantity,
            0,
          );

      const availableQty =
        saleItem.quantity -
        totalReturned;

      if (
        item.quantity >
        availableQty
      ) {
        throw new BadRequestException(
          `Quantity return melebihi pembelian. Maksimal return ${availableQty}`,
        );
      }

      totalRefund +=
        item.subtotal;
    }

    const returnTransaction =
      await this.prisma.$transaction(
        async (prisma) => {
          const createdReturn =
            await prisma.returnTransaction.create(
              {
                data: {
                  saleId:
                    dto.saleId,

                  reason:
                    dto.reason,

                  totalRefund,

                  items: {
                    create:
                      dto.items.map(
                        (
                          item,
                        ) => ({
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
                  sale: true,

                  items: {
                    include: {
                      product: true,
                    },
                  },
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

            if (!product) {
              continue;
            }

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
                    'RETURN',

                  quantity:
                    item.quantity,

                  beforeStock,

                  afterStock,

                  note: `Return transaction ${sale.invoiceNumber}`,

                  createdById:
                    userId,
                },
              },
            );
          }

          await prisma.transactionHistory.create(
            {
              data: {
                saleId:
                  sale.id,

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

          await prisma.activityLog.create(
            {
              data: {
                userId,

                action:
                  'RETURN',

                entity:
                  'SALE',

                entityId:
                  sale.id,

                description: `Return transaction ${sale.invoiceNumber}`,
              },
            },
          );

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
          sale: {
            include: {
              cashier: true,

              customer: true,
            },
          },

          items: {
            include: {
              product: true,
            },
          },
        },

        orderBy: {
          createdAt:
            'desc',
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
            sale: {
              include: {
                cashier: true,

                customer: true,

                outlet: true,
              },
            },

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

  async remove(
    id: string,
    userId: string,
  ) {
    const returnData =
      await this.prisma.returnTransaction.findUnique(
        {
          where: {
            id,
          },

          include: {
            sale: true,

            items: true,
          },
        },
      );

    if (!returnData) {
      throw new NotFoundException(
        'Return tidak ditemukan',
      );
    }

    await this.prisma.$transaction(
      async (prisma) => {
        for (const item of returnData.items) {
          const product =
            await prisma.product.findUnique(
              {
                where: {
                  id: item.productId,
                },
              },
            );

          if (!product) {
            continue;
          }

          const beforeStock =
            product.stock;

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

                type:
                  'OUT',

                quantity:
                  item.quantity,

                beforeStock,

                afterStock,

                note: `Delete return ${returnData.sale.invoiceNumber}`,

                createdById:
                  userId,
              },
            },
          );
        }

        await prisma.returnItem.deleteMany(
          {
            where: {
              returnId:
                returnData.id,
            },
          },
        );

        await prisma.returnTransaction.delete(
          {
            where: {
              id:
                returnData.id,
            },
          },
        );

        await prisma.transactionHistory.create(
          {
            data: {
              saleId:
                returnData.saleId,

              action:
                'DELETE_RETURN',

              description: `Delete return ${returnData.sale.invoiceNumber}`,

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
                'DELETE',

              entity:
                'RETURN',

              entityId:
                returnData.id,

              description: `Delete return ${returnData.sale.invoiceNumber}`,
            },
          },
        );
      },
    );

    return {
      message:
        'Return berhasil dihapus',
    };
  }
}
