import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  PrismaService,
} from '../prisma/prisma.service'

import {
  Prisma,
} from '@prisma/client'

import {
  CreateStockMovementDto,
} from './dto/create-stock-movement.dto'

@Injectable()
export class StockMovementService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateStockMovementDto,
  ) {

    let product:
      Prisma.ProductGetPayload<{}> |
      null =
      null

    // SCAN BARCODE
    if (
      dto.barcode
    ) {
      product =
        await this.prisma.product.findFirst({
          where: {
            barcode:
              dto.barcode,

            storeId:
              dto.storeId,

            deletedAt:
              null,
          },
        })
    }

    // MANUAL PRODUCT
    if (
      !product &&
      dto.productId
    ) {
      product =
        await this.prisma.product.findFirst({
          where: {
            id:
              dto.productId,

            storeId:
              dto.storeId,

            deletedAt:
              null,
          },
        })
    }

    if (
      !product
    ) {
      throw new NotFoundException(
        'Produk tidak ditemukan',
      )
    }

    return this.prisma.$transaction(
      async (
        tx,
      ) => {

        let stock =
          Number(
            product.stock,
          )

        if (
          dto.type ===
          'IN'
        ) {
          stock +=
            dto.qty
        }

        if (
          dto.type ===
            'OUT' ||
          dto.type ===
            'DAMAGED'
        ) {
          if (
            stock <
            dto.qty
          ) {
            throw new BadRequestException(
              'Stok tidak mencukupi',
            )
          }

          stock -=
            dto.qty
        }

        const updated =
          await tx.product.update({
            where: {
              id:
                product.id,
            },

            data: {
              stock,
            },
          })

        const history =
          await tx.stockMovement.create({
            data: {
              storeId:
                dto.storeId,

              productId:
                product.id,

              qty:
                dto.qty,

              type:
                dto.type,

              note:
                dto.note ??
                null,
            },

            include: {
              product:
                true,
            },
          })

        return {
          message:
            'Stok berhasil diperbarui',

          product:
            updated,

          movement:
            history,
        }
      },
    )
  }

  async findAll(
    storeId: string,
  ) {
    return this.prisma.stockMovement.findMany({
      where: {
        storeId,
      },

      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
      },

      orderBy: {
        createdAt:
          'desc',
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

      include: {
        product:
          true,
      },

      orderBy: {
        createdAt:
          'desc',
      },
    })
  }
}