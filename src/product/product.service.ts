import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  private MAX_INT =
    2147483647

  private createBarcode(
    productId?: string,
  ) {
    return (
      `${Date.now()}` +
      `${Math.floor(
        1000 +
        Math.random() * 9000,
      )}` +
      `${productId?.slice(
        0,
        4,
      ) ?? ''}`
    )
  }

  private createSku() {
    return `PRD-${Math.floor(
      100000 +
      Math.random() *
      900000,
    )}`
  }

  async create(
    dto: CreateProductDto,
  ) {
    const store =
      await this.prisma.store.findUnique({
        where: {
          id:
            dto.storeId,
        },
      })

    if (!store) {
      throw new NotFoundException(
        'Store tidak ditemukan',
      )
    }

    const category =
      await this.prisma.category.findFirst({
        where: {
          id:
            dto.categoryId,

          storeId:
            dto.storeId,
        },
      })

    if (!category) {
      throw new NotFoundException(
        'Category tidak ditemukan',
      )
    }

    if (
      dto.costPrice >
      this.MAX_INT
    ) {
      throw new ConflictException(
        'Harga modal terlalu besar',
      )
    }

    if (
      dto.sellingPrice >
      this.MAX_INT
    ) {
      throw new ConflictException(
        'Harga jual terlalu besar',
      )
    }

    const sku =
      dto.sku ??
      this.createSku()

    const skuExist =
      await this.prisma.product.findFirst({
        where: {
          storeId:
            dto.storeId,
          sku,
        },
      })

    if (skuExist) {
      throw new ConflictException(
        'SKU sudah digunakan',
      )
    }

    const product =
      await this.prisma.product.create({
        data: {
          storeId:
            dto.storeId,

          categoryId:
            dto.categoryId,

          name:
            dto.name,

          image:
            dto.image ??
            null,

          sku,

          barcode:
            null,

          description:
            dto.description ??
            null,

          costPrice:
            Number(
              dto.costPrice,
            ),

          sellingPrice:
            Number(
              dto.sellingPrice,
            ),

          stock:
            dto.stock ??
            0,

          minimumStock:
            dto.minimumStock ??
            0,

          isActive:
            dto.isActive ??
            true,
        },

        include: {
          category:
            true,
        },
      })

    const barcode =
      dto.barcode ??
      this.createBarcode(
        product.id,
      )

    return this.prisma.product.update({
      where: {
        id:
          product.id,
      },

      data: {
        barcode,
      },

      include: {
        category:
          true,
      },
    })
  }

  async findAll(
    storeId: string,
  ) {
    return this.prisma.product.findMany({
      where: {
        storeId,
        deletedAt: null,
      },

      include: {
        category: true,

        discounts: {
          include: {
            discount: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(
    id: string,
  ) {
    const product =
      await this.prisma.product.findFirst({
        where: {
          id,
          deletedAt: null,
        },

        include: {
          category: true,

          discounts: {
            include: {
              discount: true,
            },
          },
        },
      })

    if (!product) {
      throw new NotFoundException(
        'Produk tidak ditemukan',
      )
    }

    return product
  }

  async findByBarcode(
    barcode: string,
  ) {
    const product =
      await this.prisma.product.findFirst({
        where: {
          barcode,
          deletedAt: null,
        },

        include: {
          category: true,

          discounts: {
            include: {
              discount: true,
            },
          },
        },
      })

    if (!product) {
      throw new NotFoundException(
        'Barcode tidak ditemukan',
      )
    }

    return product
  }

  async generateBarcode(
    id: string,
  ) {
    await this.findOne(
      id,
    )

    return this.prisma.product.update({
      where: {
        id,
      },

      data: {
        barcode:
          this.createBarcode(
            id,
          ),
      },
    })
  }

  async generateAllBarcodes(
    storeId: string,
  ) {
    const products =
      await this.prisma.product.findMany({
        where: {
          storeId,

          deletedAt:
            null,
        },
      })

    for (
      const p
      of products
    ) {
      await this.prisma.product.update({
        where: {
          id:
            p.id,
        },

        data: {
          barcode:
            this.createBarcode(
              p.id,
            ),
        },
      })
    }

    return {
      message:
        `${products.length} barcode berhasil dibuat`,
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    const updateData = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined && value !== "")
    );

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  async updateStock(
    id: string,
    stock: number,
  ) {
    await this.findOne(
      id,
    )

    return this.prisma.product.update({
      where: {
        id,
      },

      data: {
        stock,
      },
    })
  }

  async remove(
    id: string,
  ) {
    await this.findOne(
      id,
    )

    await this.prisma.product.update({
      where: {
        id,
      },

      data: {
        deletedAt:
          new Date(),

        isActive:
          false,
      },
    })

    return {
      message:
        'Produk berhasil dihapus',
    }
  }
}