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
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateCustomerDto,
  ) {
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

    const customer =
      await this.prisma.customer.create({
        data: {
          name: dto.name,

          phone: dto.phone,

          email: dto.email,

          address: dto.address,
        },
      });

      return {
        message:
          'Customer berhasil dibuat',

        data: customer,
      };
  }

  async findAll() {
    return this.prisma.customer.findMany({
      include: {
        sales: {
          select: {
            id: true,

            invoiceNumber: true,

            totalAmount: true,

            createdAt: true,
          },
        },
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
              items: {
                include: {
                  product: true,
                },
              },

              cashier: true,
            },

            orderBy: {
              createdAt:
                'desc',
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

    if (
      dto.phone &&
      dto.phone !==
        customer.phone
    ) {
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

    const updatedCustomer =
      await this.prisma.customer.update({
        where: {
          id,
        },

        data: {
          name:
            dto.name ??
            customer.name,

          phone:
            dto.phone ??
            customer.phone,

          email:
            dto.email ??
            customer.email,

          address:
            dto.address ??
            customer.address,
        },
      });

    return {
      message:
        'Customer berhasil diupdate',

      data: updatedCustomer,
    };
  }

  async remove(id: string) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id,
        },

        include: {
          sales: true,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan',
      );
    }

    if (
      customer.sales.length > 0
    ) {
      throw new ConflictException(
        'Customer memiliki transaksi dan tidak bisa dihapus',
      );
    }

    await this.prisma.customer.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Customer berhasil dihapus',
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

          {
            email: {
              contains: query,
            },
          },
        ],
      },

      orderBy: {
        name: 'asc',
      },

      take: 20,
    });
  }

  async addPoints(
    customerId: string,

    points: number,
  ) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan',
      );
    }

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

  async reducePoints(
    customerId: string,

    points: number,
  ) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan',
      );
    }

    const remainingPoints =
      customer.points - points;

    if (remainingPoints < 0) {
      throw new ConflictException(
        'Point customer tidak cukup',
      );
    }

    return this.prisma.customer.update({
      where: {
        id: customerId,
      },

      data: {
        points: {
          decrement: points,
        },
      },
    });
  }
}
