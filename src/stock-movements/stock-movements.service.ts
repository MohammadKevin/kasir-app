import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { StockMovementType } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';

@Injectable()
export class StockMovementsService {
  constructor(private prisma: PrismaService) {}

  async createAdjustment(
    dto: CreateStockAdjustmentDto,
    userId: string,
  ) {
    const product =
      await this.prisma.product.findUnique({
        where: {
          id: dto.productId,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product tidak ditemukan',
      );
    }

    const beforeStock = product.stock;

    let afterStock = beforeStock;

    if (
      dto.type === 'IN' ||
      dto.type === 'RETURN' ||
      dto.type === 'ADJUSTMENT'
    ) {
      afterStock =
        beforeStock + dto.quantity;
    }

    if (
      dto.type === 'OUT' ||
      dto.type === 'SALE' ||
      dto.type === 'CANCEL'
    ) {
      if (beforeStock < dto.quantity) {
        throw new BadRequestException(
          'Stock tidak cukup',
        );
      }

      afterStock =
        beforeStock - dto.quantity;
    }

    await this.prisma.product.update({
      where: {
        id: dto.productId,
      },

      data: {
        stock: afterStock,
      },
    });

    const movement =
      await this.prisma.stockMovement.create({
        data: {
          productId: dto.productId,

          type:
            dto.type as StockMovementType,

          quantity: dto.quantity,

          beforeStock,

          afterStock,

          note: dto.note,

          createdById: userId,
        },

        include: {
          product: true,

          createdBy: true,
        },
      });

    await this.prisma.activityLog.create({
      data: {
        userId,

        action: 'STOCK_ADJUSTMENT',

        entity: 'PRODUCT',

        entityId: dto.productId,

        description: `Stock ${dto.type} ${dto.quantity}`,
      },
    });

    return movement;
  }

  async findAll() {
    return this.prisma.stockMovement.findMany({
      include: {
        product: true,

        createdBy: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const movement =
      await this.prisma.stockMovement.findUnique(
        {
          where: {
            id,
          },

          include: {
            product: true,

            createdBy: true,
          },
        },
      );

    if (!movement) {
      throw new NotFoundException(
        'Stock movement tidak ditemukan',
      );
    }

    return movement;
  }

  async getProductHistory(
    productId: string,
  ) {
    return this.prisma.stockMovement.findMany(
      {
        where: {
          productId,
        },

        include: {
          createdBy: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      },
    );
  }
}