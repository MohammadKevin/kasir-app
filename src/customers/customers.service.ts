import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    if (dto.phone) {
      const existingPhone =
        await this.prisma.customer.findUnique({
          where: {
            phone: dto.phone,
          },
        });

      if (existingPhone) {
        throw new ConflictException(
          'Nomor telepon sudah digunakan',
        );
      }
    }

    return this.prisma.customer.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      include: {
        sales: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id,
        },

        include: {
          sales: {
            include: {
              items: true,
            },

            orderBy: {
              createdAt: 'desc',
            },
          },

          carts: true,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan',
      );
    }

    return customer;
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
  ) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan',
      );
    }

    return this.prisma.customer.update({
      where: {
        id,
      },

      data: dto,
    });
  }

  async remove(id: string) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan',
      );
    }

    await this.prisma.customer.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Customer berhasil dihapus',
    };
  }

  async search(query: string) {
    return this.prisma.customer.findMany({
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
        ],
      },

      take: 20,
    });
  }

  async addPoints(
    customerId: string,
    points: number,
  ) {
    return this.prisma.customer.update({
      where: {
        id: customerId,
      },

      data: {
        points: {
          increment: points,
        },
      },
    });
  }
}