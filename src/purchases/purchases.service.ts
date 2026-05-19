import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto) {
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

    for (const item of dto.items) {
      totalAmount += item.quantity * item.costPrice;
    }

    const purchaseCount =
      await this.prisma.purchase.count();

    const purchase =
      await this.prisma.purchase.create({
        data: {
          invoiceNumber: `PUR-${String(
            purchaseCount + 1,
          ).padStart(5, '0')}`,

          supplierId: dto.supplierId,

          outletId: dto.outletId,

          totalAmount,

          notes: dto.notes,
        },
      });

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

      const subtotal =
        item.quantity * item.costPrice;

      await this.prisma.purchaseItem.create({
        data: {
          purchaseId: purchase.id,

          productId: item.productId,

          quantity: item.quantity,

          costPrice: item.costPrice,

          subtotal,
        },
      });

      const beforeStock = product.stock;

      const afterStock =
        beforeStock + item.quantity;

      await this.prisma.product.update({
        where: {
          id: item.productId,
        },

        data: {
          stock: afterStock,
          costPrice: item.costPrice,
        },
      });

      await this.prisma.stockMovement.create({
        data: {
          productId: item.productId,

          type: 'IN',

          quantity: item.quantity,

          beforeStock,

          afterStock,

          note: `Restock purchase ${purchase.invoiceNumber}`,
        },
      });
    }

    return this.findOne(purchase.id);
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

    for (const item of purchase.items) {
      const product =
        await this.prisma.product.findUnique({
          where: {
            id: item.productId,
          },
        });

      if (product) {
        const beforeStock = product.stock;

        const afterStock =
          beforeStock - item.quantity;

        await this.prisma.product.update({
          where: {
            id: item.productId,
          },

          data: {
            stock: afterStock,
          },
        });

        await this.prisma.stockMovement.create({
          data: {
            productId: item.productId,

            type: 'OUT',

            quantity: item.quantity,

            beforeStock,

            afterStock,

            note: `Delete purchase ${purchase.invoiceNumber}`,
          },
        });
      }
    }

    await this.prisma.purchase.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Purchase berhasil dihapus',
    };
  }
}