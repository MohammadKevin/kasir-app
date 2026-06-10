import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { CreateSupplierDto } from './dto/create-supplier.dto'
import { UpdateSupplierDto } from './dto/update-supplier.dto'

@Injectable()
export class SupplierService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateSupplierDto,
  ) {
    const store =
      await this.prisma.store.findUnique({
        where: {
          id: dto.storeId,
        },
      })

    if (!store) {
      throw new NotFoundException(
        'Store tidak ditemukan',
      )
    }

    const exist =
      await this.prisma.supplier.findFirst({
        where: {
          storeId: dto.storeId,
          name: dto.name,
        },
      })

    if (exist) {
      throw new ConflictException(
        'Supplier sudah ada',
      )
    }

    return this.prisma.supplier.create({
      data: dto,
    })
  }

  async findAll(
    storeId: string,
  ) {
    return this.prisma.supplier.findMany({
      where: {
        storeId,
      },

      include: {
        purchases: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(
    id: string,
  ) {
    const supplier =
      await this.prisma.supplier.findUnique({
        where: {
          id,
        },

        include: {
          purchases: true,
        },
      })

    if (!supplier) {
      throw new NotFoundException(
        'Supplier tidak ditemukan',
      )
    }

    return supplier
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
  ) {
    await this.findOne(id)

    return this.prisma.supplier.update({
      where: {
        id,
      },

      data: dto,
    })
  }

  async remove(
    id: string,
  ) {
    await this.findOne(id)

    await this.prisma.supplier.delete({
      where: {
        id,
      },
    })

    return {
      message:
        'Supplier berhasil dihapus',
    }
  }
}