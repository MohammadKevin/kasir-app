import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { AssignProductDto } from './dto/assign-product.dto';

@Injectable()
export class DiscountService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDiscountDto) {
    return this.prisma.discount.create({
      data: dto,
    });
  }

  async findAll(storeId: string) {
    return this.prisma.discount.findMany({
      where: {
        storeId,
      },
      include: {
        products: {
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
    const discount = await this.prisma.discount.findUnique({
      where: {
        id,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount tidak ditemukan');
    }

    return discount;
  }

  async update(id: string, dto: UpdateDiscountDto) {
    await this.findOne(id);

    return this.prisma.discount.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.$transaction([
      this.prisma.discountProduct.deleteMany({
        where: {
          discountId: id,
        },
      }),

      this.prisma.discount.delete({
        where: {
          id,
        },
      }),
    ]);

    return {
      message: 'Discount berhasil dihapus',
    };
  }

  async assignProduct(discountId: string, dto: AssignProductDto) {
    const exist = await this.prisma.discountProduct.findFirst({
      where: {
        discountId,
        productId: dto.productId,
      },
    });

    if (exist) {
      throw new ConflictException('Produk sudah ditambahkan');
    }

    return this.prisma.discountProduct.create({
      data: {
        discountId,
        productId: dto.productId,
      },
    });
  }

  async removeProduct(discountId: string, productId: string) {
    await this.prisma.discountProduct.deleteMany({
      where: {
        discountId,
        productId,
      },
    });

    return {
      message: 'Produk dilepas dari discount',
    };
  }
}
