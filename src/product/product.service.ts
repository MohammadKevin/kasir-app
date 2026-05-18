import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateProductDto, file?: Express.Multer.File) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        name: dto.name,
        outletId: dto.outletId,
      },
    });

    if (existingProduct) {
      throw new BadRequestException('Product sudah ada');
    }

    const outlet = await this.prisma.outlet.findUnique({
      where: {
        id: dto.outletId,
      },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet tidak ditemukan');
    }

    let imageUrl: string | undefined;

    if (file) {
      imageUrl = await this.cloudinaryService.uploadFile(file);
    }

    const totalProduct = await this.prisma.product.count();

    const generatedSku = `PRD-${String(totalProduct + 1).padStart(4, '0')}`;

    const generatedBarcode = `899${Date.now()}`;

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,

        sku: dto.sku || generatedSku,

        barcode: dto.barcode || generatedBarcode,

        stock: dto.stock,

        minStock: dto.minStock,

        costPrice: dto.costPrice,

        sellingPrice: dto.sellingPrice,

        categoryId: dto.categoryId,

        outletId: dto.outletId,

        imageUrl,
      },
    });

    return {
      message: 'Product berhasil dibuat',

      data: product,
    };
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        outlet: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },

      include: {
        category: true,
        outlet: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product tidak ditemukan');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, file?: Express.Multer.File) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product tidak ditemukan');
    }

    let imageUrl = product.imageUrl;

    if (file) {
      imageUrl = await this.cloudinaryService.uploadFile(file);
    }

    const updatedProduct = await this.prisma.product.update({
      where: {
        id,
      },

      data: {
        name: dto.name,

        sku: dto.sku || product.sku,

        barcode: dto.barcode || product.barcode,

        stock: dto.stock,

        minStock: dto.minStock,

        costPrice: dto.costPrice,

        sellingPrice: dto.sellingPrice,

        categoryId: dto.categoryId,

        imageUrl,
      },
    });

    return {
      message: 'Product berhasil diupdate',

      data: updatedProduct,
    };
  }

  async remove(id: string) {
  const product =
    await this.prisma.product.findUnique({
      where: { id },
    });

  if (!product) {
    throw new NotFoundException(
      'Produk tidak ditemukan',
    );
  }

  const usedInTransaction =
    await this.prisma.saleItem.findFirst({
      where: {
        productId: id,
      },
    });

  if (usedInTransaction) {
    throw new BadRequestException(
      'Produk sudah digunakan dalam transaksi dan tidak bisa dihapus',
    );
  }

  try {
    await this.prisma.product.delete({
      where: { id },
    });

    return {
      message:
        'Produk berhasil dihapus',
    };
  } catch (error) {
    console.error(error);

    throw new InternalServerErrorException(
      'Gagal menghapus produk',
    );
  }
}
}
