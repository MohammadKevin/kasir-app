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

  async create(
    dto: CreateProductDto,
    file?: Express.Multer.File,
  ) {
    const existingProduct =
      await this.prisma.product.findFirst({
        where: {
          name: dto.name,
          outletId: dto.outletId,
        },
      });

    if (existingProduct) {
      throw new BadRequestException(
        'Product sudah ada',
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

    if (dto.categoryId) {
      const category =
        await this.prisma.category.findUnique(
          {
            where: {
              id: dto.categoryId,
            },
          },
        );

      if (!category) {
        throw new NotFoundException(
          'Category tidak ditemukan',
        );
      }
    }

    if (dto.sku) {
      const existingSku =
        await this.prisma.product.findFirst({
          where: {
            sku: dto.sku,
          },
        });

      if (existingSku) {
        throw new BadRequestException(
          'SKU sudah digunakan',
        );
      }
    }

    if (dto.barcode) {
      const existingBarcode =
        await this.prisma.product.findFirst({
          where: {
            barcode: dto.barcode,
          },
        });

      if (existingBarcode) {
        throw new BadRequestException(
          'Barcode sudah digunakan',
        );
      }
    }

    let imageUrl: string | undefined;

    if (file) {
      imageUrl =
        await this.cloudinaryService.uploadFile(
          file,
        );
    }

    const totalProduct =
      await this.prisma.product.count();

    const generatedSku = `PRD-${String(
      totalProduct + 1,
    ).padStart(4, '0')}`;

    const generatedBarcode = `899${Date.now()}`;

    const product =
      await this.prisma.$transaction(
        async (prisma) => {
          const createdProduct =
            await prisma.product.create({
              data: {
                name: dto.name,

                sku:
                  dto.sku ||
                  generatedSku,

                barcode:
                  dto.barcode ||
                  generatedBarcode,

                stock: dto.stock,

                minStock:
                  dto.minStock,

                costPrice:
                  dto.costPrice,

                sellingPrice:
                  dto.sellingPrice,

                categoryId:
                  dto.categoryId,

                outletId:
                  dto.outletId,

                imageUrl,
              },
            });

          await prisma.stockMovement.create({
            data: {
              productId:
                createdProduct.id,

              type: 'IN',

              quantity: dto.stock,

              beforeStock: 0,

              afterStock: dto.stock,

              note: 'Initial stock',
            },
          });

          return createdProduct;
        },
      );

    return {
      message:
        'Product berhasil dibuat',

      data: product,
    };
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
      },

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
    const product =
      await this.prisma.product.findUnique({
        where: {
          id,
        },

        include: {
          category: true,

          outlet: true,

          stockMovements: {
            orderBy: {
              createdAt: 'desc',
            },

            take: 20,
          },
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product tidak ditemukan',
      );
    }

    return product;
  }

  async findByBarcode(
    barcode: string,
  ) {
    const product =
      await this.prisma.product.findFirst({
        where: {
          barcode,

          isActive: true,
        },

        include: {
          category: true,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product tidak ditemukan',
      );
    }

    return product;
  }

  async findLowStock() {
    const products =
      await this.prisma.product.findMany({
        where: {
          isActive: true,
        },

        include: {
          category: true,

          outlet: true,
        },
      });

    return products.filter(
      (product) =>
        product.stock <=
        product.minStock,
    );
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    file?: Express.Multer.File,
  ) {
    const product =
      await this.prisma.product.findUnique({
        where: {
          id,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product tidak ditemukan',
      );
    }

    if (dto.categoryId) {
      const category =
        await this.prisma.category.findUnique(
          {
            where: {
              id: dto.categoryId,
            },
          },
        );

      if (!category) {
        throw new NotFoundException(
          'Category tidak ditemukan',
        );
      }
    }

    if (dto.sku) {
      const existingSku =
        await this.prisma.product.findFirst({
          where: {
            sku: dto.sku,

            NOT: {
              id,
            },
          },
        });

      if (existingSku) {
        throw new BadRequestException(
          'SKU sudah digunakan',
        );
      }
    }

    if (dto.barcode) {
      const existingBarcode =
        await this.prisma.product.findFirst({
          where: {
            barcode: dto.barcode,

            NOT: {
              id,
            },
          },
        });

      if (existingBarcode) {
        throw new BadRequestException(
          'Barcode sudah digunakan',
        );
      }
    }

    let imageUrl =
      product.imageUrl;

    if (file) {
      imageUrl =
        await this.cloudinaryService.uploadFile(
          file,
        );
    }

    const updatedProduct =
      await this.prisma.$transaction(
        async (prisma) => {
          if (
            dto.stock !== undefined &&
            dto.stock !== product.stock
          ) {
            await prisma.stockMovement.create({
              data: {
                productId:
                  product.id,

                type: 'ADJUSTMENT',

                quantity: Math.abs(
                  dto.stock -
                    product.stock,
                ),

                beforeStock:
                  product.stock,

                afterStock:
                  dto.stock,

                note:
                  'Manual stock adjustment',
              },
            });
          }

          return prisma.product.update({
            where: {
              id,
            },

            data: {
              name:
                dto.name ??
                product.name,

              sku:
                dto.sku ??
                product.sku,

              barcode:
                dto.barcode ??
                product.barcode,

              stock:
                dto.stock ??
                product.stock,

              minStock:
                dto.minStock ??
                product.minStock,

              costPrice:
                dto.costPrice ??
                product.costPrice,

              sellingPrice:
                dto.sellingPrice ??
                product.sellingPrice,

              categoryId:
                dto.categoryId ??
                product.categoryId,

              imageUrl,
            },
          });
        },
      );

    return {
      message:
        'Product berhasil diupdate',

      data: updatedProduct,
    };
  }

  async remove(id: string) {
    const product =
      await this.prisma.product.findUnique({
        where: {
          id,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Produk tidak ditemukan',
      );
    }

    try {
      await this.prisma.product.update({
        where: {
          id,
        },

        data: {
          isActive: false,
        },
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
