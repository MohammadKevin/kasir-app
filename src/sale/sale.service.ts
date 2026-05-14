import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSaleDto, cashierId: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: {
        id: dto.outletId,
      },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet tidak ditemukan');
    }

    let totalAmount = 0;
    let totalProfit = 0;

    const saleItems: {
      productId: string;
      quantity: number;
      costPrice: number;
      sellingPrice: number;
      subtotal: number;
      profit: number;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        throw new NotFoundException('Product tidak ditemukan');
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock product ${product.name} tidak cukup`,
        );
      }

      const subtotal = product.sellingPrice * item.quantity;

      const profit = (product.sellingPrice - product.costPrice) * item.quantity;

      totalAmount += subtotal;
      totalProfit += profit;

      saleItems.push({
        productId: product.id,

        quantity: item.quantity,

        costPrice: product.costPrice,

        sellingPrice: product.sellingPrice,

        subtotal,
        profit,
      });
    }

    if (dto.paymentMethod === 'CASH') {
      if (!dto.paidAmount || dto.paidAmount < totalAmount) {
        throw new BadRequestException('Uang pembayaran kurang');
      }
    }

    const invoiceNumber = `INV-${Date.now()}`;

    const sale = await this.prisma.$transaction(async (prisma) => {
      const createdSale = await prisma.sale.create({
        data: {
          invoiceNumber,

          totalAmount,
          totalProfit,

          paymentMethod: dto.paymentMethod,

          paymentStatus: 'PAID',

          paidAmount: dto.paidAmount,

          changeAmount: dto.paidAmount ? dto.paidAmount - totalAmount : 0,

          paymentProof: dto.paymentProof,

          outletId: dto.outletId,

          cashierId,

          items: {
            create: saleItems,
          },
        },

        include: {
          items: true,
        },
      });

      for (const item of dto.items) {
        await prisma.product.update({
          where: {
            id: item.productId,
          },

          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return createdSale;
    });

    return {
      message: 'Transaction berhasil',

      data: sale,
    };
  }

  async findAll() {
    return this.prisma.sale.findMany({
      include: {
        outlet: true,

        cashier: true,

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
    const sale = await this.prisma.sale.findUnique({
      where: {
        id,
      },

      include: {
        outlet: true,

        cashier: true,

        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Transaction tidak ditemukan');
    }

    return sale;
  }
}
