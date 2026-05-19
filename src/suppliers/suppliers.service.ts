// suppliers/suppliers.service.ts

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    if (dto.email) {
      const existingEmail =
        await this.prisma.supplier.findFirst({
          where: {
            email: dto.email,
          },
        });

      if (existingEmail) {
        throw new ConflictException(
          'Email supplier sudah digunakan',
        );
      }
    }

    return this.prisma.supplier.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.supplier.findMany({
      include: {
        purchases: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const supplier =
      await this.prisma.supplier.findUnique({
        where: {
          id,
        },

        include: {
          purchases: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },

              outlet: true,
            },

            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Supplier tidak ditemukan',
      );
    }

    return supplier;
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
  ) {
    const supplier =
      await this.prisma.supplier.findUnique({
        where: {
          id,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Supplier tidak ditemukan',
      );
    }

    return this.prisma.supplier.update({
      where: {
        id,
      },

      data: dto,
    });
  }

  async remove(id: string) {
    const supplier =
      await this.prisma.supplier.findUnique({
        where: {
          id,
        },

        include: {
          purchases: true,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Supplier tidak ditemukan',
      );
    }

    if (supplier.purchases.length > 0) {
      throw new ConflictException(
        'Supplier tidak bisa dihapus karena memiliki purchase',
      );
    }

    await this.prisma.supplier.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Supplier berhasil dihapus',
    };
  }

  async search(query: string) {
    return this.prisma.supplier.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
            },
          },

          {
            phone: {
              contains: query,
            },
          },

          {
            email: {
              contains: query,
            },
          },
        ],
      },

      take: 20,
    });
  }
}