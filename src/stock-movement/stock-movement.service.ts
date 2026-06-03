import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { CreateStockMovementDto } from './dto/create-stock-movement.dto'

@Injectable()
export class StockMovementService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateStockMovementDto,
  ) {
    const product =
      await this.prisma.product.findUnique({
        where: {
          id: dto.productId,
        },
      })

    if (!product) {
      throw new NotFoundException(
        'Produk tidak ditemukan',
      )
    }

    if (dto.type === 'IN') {
      await this.prisma.product.update({
        where: {
          id: dto.productId,
        },

        data: {
          stock: {
            increment: dto.qty,
          },
        },
      })
    }

    if (
      dto.type === 'OUT' ||
      dto.type === 'DAMAGED'
    ) {
      if (
        product.stock < dto.qty
      ) {
        throw new BadRequestException(
          'Stok tidak mencukupi',
        )
      }

      await this.prisma.product.update({
        where: {
          id: dto.productId,
        },

        data: {
          stock: {
            decrement: dto.qty,
          },
        },
      })
    }

    return this.prisma.stockMovement.create({
      data: dto,
    })
  }

  async findAll(
    storeId: string,
  ) {
    return this.prisma.stockMovement.findMany({
      where: {
        storeId,
      },

      include: {
        product: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findByProduct(
    productId: string,
  ) {
    return this.prisma.stockMovement.findMany({
      where: {
        productId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}