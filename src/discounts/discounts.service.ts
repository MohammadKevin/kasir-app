import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

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
      dto.type ===
        'PERCENTAGE' &&
      dto.value > 100
    ) {
      throw new BadRequestException(
        'Discount percentage maksimal 100%',
      );
    }

    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.endDate) <
        new Date(dto.startDate)
    ) {
      throw new BadRequestException(
        'End date tidak valid',
      );
    }

    const normalizedCode =
      dto.code?.toUpperCase();

    if (normalizedCode) {
      const existingDiscount =
        await this.prisma.discount.findFirst({
          where: {
            code:
              normalizedCode,
          },
        });

      if (existingDiscount) {
        throw new BadRequestException(
          'Code discount sudah digunakan',
        );
      }
    }

    const discount =
      await this.prisma.discount.create({
        data: {
          name: dto.name,

          code:
            normalizedCode,

          type: dto.type,

          value: dto.value,

          minPurchase:
            dto.minPurchase,

          maxDiscount:
            dto.maxDiscount,

          startDate:
            dto.startDate
              ? new Date(
                  dto.startDate,
                )
              : null,

          endDate:
            dto.endDate
              ? new Date(
                  dto.endDate,
                )
              : null,

          isActive:
            dto.isActive ??
            true,

          scope:
            dto.scope ??
            'GLOBAL',

          createdById:
            userId,
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

  async findActive() {
    const now = new Date();

    return this.prisma.discount.findMany({
      where: {
        isActive: true,

        OR: [
          {
            startDate: null,
          },

          {
            startDate: {
              lte: now,
            },
          },
        ],

        AND: [
          {
            OR: [
              {
                endDate: null,
              },

              {
                endDate: {
                  gte: now,
                },
              },
            ],
          },
        ],
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const discount =
      await this.prisma.discount.findUnique({
        where: {
          id,
        },

        include: {
          createdBy: {
            select: {
              id: true,

              name: true,

              email: true,
            },
          },
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
        where: {
          id,
        },
      });

    if (!discount) {
      throw new NotFoundException(
        'Discount tidak ditemukan',
      );
    }

    if (
      dto.type ===
        'PERCENTAGE' &&
      dto.value &&
      dto.value > 100
    ) {
      throw new BadRequestException(
        'Discount percentage maksimal 100%',
      );
    }

    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.endDate) <
        new Date(dto.startDate)
    ) {
      throw new BadRequestException(
        'End date tidak valid',
      );
    }

    const normalizedCode =
      dto.code?.toUpperCase();

    if (
      normalizedCode &&
      normalizedCode !==
        discount.code
    ) {
      const existingDiscount =
        await this.prisma.discount.findFirst({
          where: {
            code:
              normalizedCode,
          },
        });

      if (existingDiscount) {
        throw new BadRequestException(
          'Code discount sudah digunakan',
        );
      }
    }

    const updatedDiscount =
      await this.prisma.discount.update({
        where: {
          id,
        },

        data: {
          name:
            dto.name ??
            discount.name,

          code:
            normalizedCode ??
            discount.code,

          type:
            dto.type ??
            discount.type,

          value:
            dto.value ??
            discount.value,

          minPurchase:
            dto.minPurchase ??
            discount.minPurchase,

          maxDiscount:
            dto.maxDiscount ??
            discount.maxDiscount,

          startDate:
            dto.startDate
              ? new Date(
                  dto.startDate,
                )
              : discount.startDate,

          endDate:
            dto.endDate
              ? new Date(
                  dto.endDate,
                )
              : discount.endDate,

          isActive:
            dto.isActive ??
            discount.isActive,

          scope:
            dto.scope ??
            discount.scope,
        },
      });

    return {
      message:
        'Discount berhasil diupdate',

      data:
        updatedDiscount,
    };
  }

  async remove(id: string) {
    const discount =
      await this.prisma.discount.findUnique({
        where: {
          id,
        },
      });

    if (!discount) {
      throw new NotFoundException(
        'Discount tidak ditemukan',
      );
    }

    await this.prisma.discount.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Discount berhasil dihapus',
    };
  }

  async validateDiscount(
    code: string,
    subtotal: number,
  ) {
    const now = new Date();

    const discount =
      await this.prisma.discount.findFirst({
        where: {
          code:
            code.toUpperCase(),

          isActive: true,
        },
      });

    if (!discount) {
      throw new BadRequestException(
        'Discount tidak valid',
      );
    }

    if (
      discount.startDate &&
      discount.startDate > now
    ) {
      throw new BadRequestException(
        'Discount belum dimulai',
      );
    }

    if (
      discount.endDate &&
      discount.endDate < now
    ) {
      throw new BadRequestException(
        'Discount sudah expired',
      );
    }

    if (
      discount.minPurchase &&
      subtotal <
        discount.minPurchase
    ) {
      throw new BadRequestException(
        `Minimal pembelian Rp ${discount.minPurchase}`,
      );
    }

    let discountAmount = 0;

    if (
      discount.type ===
      'PERCENTAGE'
    ) {
      discountAmount =
        (subtotal *
          discount.value) /
        100;
    }

    if (
      discount.type ===
      'FIXED'
    ) {
      discountAmount =
        discount.value;
    }

    if (
      discount.maxDiscount &&
      discountAmount >
        discount.maxDiscount
    ) {
      discountAmount =
        discount.maxDiscount;
    }

    if (
      discountAmount >
      subtotal
    ) {
      discountAmount =
        subtotal;
    }

    return {
      valid: true,

      discount,

      discountAmount,
    };
  }
}
