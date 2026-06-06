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
  ) {}

  async create(dto: CreateProductDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
    })

    if (!store) {
      throw new NotFoundException('Store tidak ditemukan')
    }

    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        storeId: dto.storeId,
      },
    })

    if (!category) {
      throw new NotFoundException('Category tidak ditemukan di store ini')
    }

    const sku =
      dto.sku ??
      `PRD-${Math.floor(100000 + Math.random() * 900000)}`

    const barcode =
      dto.barcode ??
      `${Date.now()}${Math.floor(Math.random() * 1000)}`

    const skuExist = await this.prisma.product.findFirst({
      where: {
        storeId: dto.storeId,
        sku,
      },
    })

    if (skuExist) {
      throw new ConflictException('SKU sudah digunakan')
    }

    const barcodeExist = await this.prisma.product.findFirst({
      where: {
        storeId: dto.storeId,
        barcode,
      },
    })

    if (barcodeExist) {
      throw new ConflictException('Barcode sudah digunakan')
    }

    return this.prisma.product.create({
      data: {
        storeId: dto.storeId,
        categoryId: dto.categoryId,
        name: dto.name,
        image: dto.image || null,
        sku,
        barcode,
        description: dto.description || null,
        costPrice: dto.costPrice,
        sellingPrice: dto.sellingPrice,
        stock: dto.stock ?? 0,
        minimumStock: dto.minimumStock ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        category: true,
      },
    })
  }

  async findAll(storeId: string) {
    return this.prisma.product.findMany({
      where: {
        storeId,
        deletedAt: null,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        category: true,
      },
    })

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan')
    }

    return product
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        barcode,
        deletedAt: null,
      },
      include: {
        category: true,
      },
    })

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan')
    }

    return product
  }

  async generateBarcode(id: string) {
    await this.findOne(id)

    return this.prisma.product.update({
      where: { id },
      data: {
        barcode: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      },
    })
  }

  async generateAllBarcodes(storeId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        storeId,
        barcode: null,
        deletedAt: null,
      },
    })

    for (const product of products) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          barcode: `${Date.now()}${Math.floor(Math.random() * 1000)}${product.id.slice(0, 4)}`,
        },
      })
    }

    return {
      message: `${products.length} barcode berhasil dibuat`,
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id)

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          storeId: product.storeId,
        },
      })

      if (!category) {
        throw new NotFoundException('Category tidak ditemukan di store ini')
      }
    }

    if (dto.sku) {
      const skuExist = await this.prisma.product.findFirst({
        where: {
          sku: dto.sku,
          NOT: { id },
        },
      })

      if (skuExist) {
        throw new ConflictException('SKU sudah digunakan')
      }
    }

    if (dto.barcode) {
      const barcodeExist = await this.prisma.product.findFirst({
        where: {
          barcode: dto.barcode,
          NOT: { id },
        },
      })

      if (barcodeExist) {
        throw new ConflictException('Barcode sudah digunakan')
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        image: dto.image,
        sku: dto.sku,
        barcode: dto.barcode,
        description: dto.description,
        costPrice: dto.costPrice,
        sellingPrice: dto.sellingPrice,
        stock: dto.stock,
        minimumStock: dto.minimumStock,
        isActive: dto.isActive,
      },
      include: {
        category: true,
      },
    })
  }

  async updateStock(id: string, stock: number) {
    await this.findOne(id)

    return this.prisma.product.update({
      where: { id },
      data: { stock },
    })
  }

  async remove(id: string) {
    await this.findOne(id)

    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    return {
      message: 'Produk berhasil dihapus',
    }
  }
}