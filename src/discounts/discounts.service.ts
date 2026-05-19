import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateDiscountDto,
} from './dto/create-discount.dto';

import {
  UpdateDiscountDto,
} from './dto/update-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(
    dto: CreateDiscountDto,
    userId: string,
  ) {
    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.startDate) >
        new Date(dto.endDate)
    ) {
      throw new BadRequestException(
        'Tanggal tidak valid',
      );
    }

    const discount =
      await this.prisma.discount.create({
        data: {
          name: dto.name,

          code: dto.code,

          type: dto.type,

          value: dto.value,

          minPurchase: dto.minPurchase,

          maxDiscount: dto.maxDiscount,

          startDate: dto.startDate
            ? new Date(dto.startDate)
            : null,

          endDate: dto.endDate
            ? new Date(dto.endDate)
            : null,

          isActive:
            dto.isActive ?? true,

          scope:
            dto.scope || 'GLOBAL',

          createdById: userId,
        },
      });

    return {
      message:
        'Discount berhasil dibuat',

      data: discount,
    };
  }

  async findAll() {
    return this.prisma.discount.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const discount =
      await this.prisma.discount.findUnique({
        where: { id },

        include: {
          createdBy: true,
        },
      });

    if (!discount) {
      throw new NotFoundException(
        'Discount tidak ditemukan',
      );
    }

    return discount;
  }

  async update(
    id: string,
    dto: UpdateDiscountDto,
  ) {
    const discount =
      await this.prisma.discount.findUnique({
        where: { id },
      });

    if (!discount) {
      throw new NotFoundException(
        'Discount tidak ditemukan',
      );
    }

    const updatedDiscount =
      await this.prisma.discount.update({
        where: { id },

        data: {
          name: dto.name,

          code: dto.code,

          type: dto.type,

          value: dto.value,

          minPurchase: dto.minPurchase,

          maxDiscount: dto.maxDiscount,

          startDate: dto.startDate
            ? new Date(dto.startDate)
            : undefined,

          endDate: dto.endDate
            ? new Date(dto.endDate)
            : undefined,

          isActive: dto.isActive,

          scope: dto.scope,
        },
      });

    return {
      message:
        'Discount berhasil diupdate',

      data: updatedDiscount,
    };
  }

  async remove(id: string) {
    const discount =
      await this.prisma.discount.findUnique({
        where: { id },
      });

    if (!discount) {
      throw new NotFoundException(
        'Discount tidak ditemukan',
      );
    }

    await this.prisma.discount.delete({
      where: { id },
    });

    return {
      message:
        'Discount berhasil dihapus',
    };
  }
}