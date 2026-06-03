import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateCustomerDto,
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

    if (dto.phone) {
      const exist =
        await this.prisma.customer.findFirst({
          where: {
            storeId: dto.storeId,
            phone: dto.phone,
          },
        })

      if (exist) {
        throw new ConflictException(
          'Nomor HP sudah terdaftar',
        )
      }
    }

    return this.prisma.customer.create({
      data: {
        storeId: dto.storeId,
        name: dto.name,
        phone: dto.phone,
      },
    })
  }

  async findAll(
    storeId: string,
  ) {
    return this.prisma.customer.findMany({
      where: {
        storeId,
      },

      include: {
        transactions: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(
    id: string,
  ) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id,
        },

        include: {
          transactions: true,
        },
      })

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan',
      )
    }

    return customer
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
  ) {
    await this.findOne(id)

    return this.prisma.customer.update({
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

    await this.prisma.customer.delete({
      where: {
        id,
      },
    })

    return {
      message:
        'Customer berhasil dihapus',
    }
  }

  async findByPhone(
    phone: string,
  ) {
    return this.prisma.customer.findFirst({
      where: {
        phone,
      },

      include: {
        transactions: true,
      },
    })
  }
}