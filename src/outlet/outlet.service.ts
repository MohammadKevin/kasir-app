import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

@Injectable()
export class OutletService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOutletDto) {
    const existingOutlet = await this.prisma.outlet.findFirst({
      where: {
        name: dto.name,
      },
    });

    if (existingOutlet) {
      throw new BadRequestException('Outlet sudah ada');
    }

    const outlet = await this.prisma.outlet.create({
      data: {
        name: dto.name,
        address: dto.address,
        noTelp: dto.noTelp,
        qrisImage: dto.qrisImage,
      },
    });

    return {
      message: 'Outlet berhasil dibuat',

      data: outlet,
    };
  }

  async findAll() {
    return this.prisma.outlet.findMany({
      include: {
        users: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: {
        id,
      },

      include: {
        users: true,
        products: true,
      },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet tidak ditemukan');
    }

    return outlet;
  }

  async update(id: string, dto: UpdateOutletDto) {
    const outlet = await this.prisma.outlet.findUnique({
      where: {
        id,
      },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet tidak ditemukan');
    }

    const updatedOutlet = await this.prisma.outlet.update({
      where: {
        id,
      },

      data: {
        name: dto.name,
        address: dto.address,
        noTelp: dto.noTelp,
        qrisImage: dto.qrisImage,
      },
    });

    return {
      message: 'Outlet berhasil diupdate',

      data: updatedOutlet,
    };
  }

  async remove(id: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: {
        id,
      },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet tidak ditemukan');
    }

    await this.prisma.outlet.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Outlet berhasil dihapus',
    };
  }
}
