import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(
    dto: CreatePurchaseDto,
  ) {
    const supplier =
      await this.prisma.supplier.findUnique({
        where: {
          id: dto.supplierId,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Supplier tidak ditemukan',
      );
    }

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

    let totalAmount = 0;

    const productSnapshots: {
      id: string;
      stock: number;
      quantity: number;
      costPrice: number;
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

      if (!product.isActive) {
        throw new BadRequestException(
          `Product ${product.name} tidak aktif`,
        );
      }

      if (
        product.outletId !==
        dto.outletId
      ) {
        throw new BadRequestException(
          `Product ${product.name} bukan milik outlet ini`,
        );
      }

      totalAmount +=
        item.quantity *
        item.costPrice;

      productSnapshots.push({
        id: product.id,

        stock: product.stock,

        quantity:
          item.quantity,

        costPrice:
          item.costPrice,
      });
    }

    const invoiceNumber = `PUR-${Date.now()}`;

    const purchase =
      await this.prisma.$transaction(
        async (prisma) => {
          const createdPurchase =
            await prisma.purchase.create({
              data: {
                invoiceNumber,

                supplierId:
                  dto.supplierId,

                outletId:
                  dto.outletId,

                totalAmount,

                notes:
                  dto.notes,

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

                        costPrice:
                          item.costPrice,

                        subtotal:
                          item.quantity *
                          item.costPrice,
                      }),
                    ),
                },
              },

              include: {
                supplier: true,

                outlet: true,

                items: {
                  include: {
                    product: true,
                  },
                },
              },
            });

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

                costPrice:
                  item.costPrice,
              },
            });

            await prisma.stockMovement.create({
              data: {
                productId:
                  item.productId,

                type: 'IN',

                quantity:
                  item.quantity,

                beforeStock,

                afterStock,

                note: `Restock purchase ${invoiceNumber}`,
              },
            });
          }

          return createdPurchase;
        },
      );

    return {
      message:
        'Purchase berhasil dibuat',

      data: purchase,
    };
  }

  async findAll() {
    return this.prisma.purchase.findMany({
      include: {
        supplier: true,

        outlet: true,

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
    const purchase =
      await this.prisma.purchase.findUnique({
        where: {
          id,
        },

        include: {
          supplier: true,

          outlet: true,

          items: {
            include: {
              product: true,
            },
          },
        },
      });

    if (!purchase) {
      throw new NotFoundException(
        'Purchase tidak ditemukan',
      );
    }

    return purchase;
  }

  async remove(id: string) {
    const purchase =
      await this.prisma.purchase.findUnique({
        where: {
          id,
        },

        include: {
          items: true,
        },
      });

    if (!purchase) {
      throw new NotFoundException(
        'Purchase tidak ditemukan',
      );
    }

    await this.prisma.$transaction(
      async (prisma) => {
        for (const item of purchase.items) {
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

          if (
            product.stock <
            item.quantity
          ) {
            throw new BadRequestException(
              `Stock ${product.name} tidak cukup untuk rollback purchase`,
            );
          }

          const beforeStock =
            product.stock;

          const afterStock =
            beforeStock -
            item.quantity;

          await prisma.product.update({
            where: {
              id: item.productId,
            },

            data: {
              stock: {
                decrement:
                  item.quantity,
              },
            },
          });

          await prisma.stockMovement.create({
            data: {
              productId:
                item.productId,

              type: 'OUT',

              quantity:
                item.quantity,

              beforeStock,

              afterStock,

              note: `Delete purchase ${purchase.invoiceNumber}`,
            },
          });
        }

        await prisma.purchase.delete({
          where: {
            id,
          },
        });
      },
    );

    return {
      message:
        'Purchase berhasil dihapus',
    };
  }
}
