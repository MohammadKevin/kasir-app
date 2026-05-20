import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateCashierDto } from './dto/create-cashier.dto';
import { UpdateCashierDto } from './dto/update-cashier.dto';

@Injectable()
export class CashiersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateCashierDto,
  ) {
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

    const existingCashier =
      await this.prisma.cashier.findFirst({
        where: {
          name: dto.name,
          outletId: dto.outletId,
        },
      });

    if (existingCashier) {
      throw new BadRequestException(
        'Cashier sudah ada',
      );
    }

    const existingPin =
      await this.prisma.cashier.findFirst({
        where: {
          outletId: dto.outletId,
          pin: dto.pin,
        },
      });

    if (existingPin) {
      throw new BadRequestException(
        'PIN sudah digunakan',
      );
    }

    const hashedPin =
      await bcrypt.hash(
        dto.pin,
        10,
      );

    const cashier =
      await this.prisma.cashier.create({
        data: {
          name: dto.name,
          pin: hashedPin,
          outletId: dto.outletId,
          isActive:
            dto.isActive ?? true,
        },
      });

    return {
      message:
        'Cashier berhasil dibuat',

      data: cashier,
    };
  }

  async findAll() {
    return this.prisma.cashier.findMany({
      include: {
        outlet: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByOutlet(
    outletId: string,
  ) {
    return this.prisma.cashier.findMany({
      where: {
        outletId,
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        isActive: true,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const cashier =
      await this.prisma.cashier.findUnique({
        where: {
          id,
        },

        include: {
          outlet: true,

          sales: {
            take: 10,

            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

    if (!cashier) {
      throw new NotFoundException(
        'Cashier tidak ditemukan',
      );
    }

    return cashier;
  }

  async update(
    id: string,
    dto: UpdateCashierDto,
  ) {
    const cashier =
      await this.prisma.cashier.findUnique({
        where: {
          id,
        },
      });

    if (!cashier) {
      throw new NotFoundException(
        'Cashier tidak ditemukan',
      );
    }

    let hashedPin =
      cashier.pin;

    if (dto.pin) {
      hashedPin =
        await bcrypt.hash(
          dto.pin,
          10,
        );
    }

    const updatedCashier =
      await this.prisma.cashier.update({
        where: {
          id,
        },

        data: {
          name:
            dto.name ??
            cashier.name,

          pin: hashedPin,

          isActive:
            dto.isActive ??
            cashier.isActive,
        },
      });

    return {
      message:
        'Cashier berhasil diupdate',

      data: updatedCashier,
    };
  }

  async remove(id: string) {
    const cashier =
      await this.prisma.cashier.findUnique({
        where: {
          id,
        },

        include: {
          sales: true,
        },
      });

    if (!cashier) {
      throw new NotFoundException(
        'Cashier tidak ditemukan',
      );
    }

    if (
      cashier.sales.length > 0
    ) {
      throw new BadRequestException(
        'Cashier memiliki transaksi',
      );
    }

    await this.prisma.cashier.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Cashier berhasil dihapus',
    };
  }
}
