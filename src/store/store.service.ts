import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    adminId: string,
    dto: CreateStoreDto,
  ) {
    const admin =
      await this.prisma.admin.findUnique({
        where: {
          id: adminId,
        },
      });

    if (!admin) {
      throw new UnauthorizedException(
        'Admin tidak ditemukan',
      );
    }

    const exist =
      await this.prisma.store.findUnique({
        where: {
          email: dto.email,
        },
      });

    if (exist) {
      throw new ConflictException(
        'Email store sudah digunakan',
      );
    }

    return this.prisma.store.create({
      data: {
        adminId,

        name: dto.name,

        email: dto.email,

        password:
          await bcrypt.hash(
            dto.password,
            10,
          ),

        phone: dto.phone,

        address: dto.address,

        logo: dto.logo,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll(
    adminId: string,
  ) {
    return this.prisma.store.findMany({
      where: {
        adminId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    id: string,
  ) {
    const store =
      await this.prisma.store.findUnique({
        where: {
          id,
        },

        include: {
          cashiers: true,
          products: true,
          customers: true,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Store tidak ditemukan',
      );
    }

    return store;
  }

  async update(
    id: string,
    dto: UpdateStoreDto,
  ) {
    await this.findOne(id);

    const data: any = {
      ...dto,
    };

    if (dto.password) {
      data.password =
        await bcrypt.hash(
          dto.password,
          10,
        );
    }

    return this.prisma.store.update({
      where: {
        id,
      },

      data,

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(
    id: string,
  ) {
    await this.findOne(id);

    await this.prisma.store.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Store berhasil dihapus',
    };
  }
}