import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import * as bcrypt from 'bcrypt'

import { PrismaService } from '../prisma/prisma.service'

import { CreateCashierDto } from './dto/create-cashier.dto'
import { UpdateCashierDto } from './dto/update-cashier.dto'
import { LoginPinDto } from './dto/login-pin.dto'

@Injectable()
export class CashierService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    adminId: string,
    dto: CreateCashierDto,
  ) {
    const store =
      await this.prisma.store.findFirst({
        where: {
          id: dto.storeId,
          adminId,
        },
      })

    if (!store) {
      throw new UnauthorizedException(
        'Store tidak ditemukan',
      )
    }

    const exist =
      await this.prisma.user.findFirst({
        where: {
          storeId: dto.storeId,
          name: dto.name,
        },
      })

    if (exist) {
      throw new ConflictException(
        'Cashier sudah ada',
      )
    }

    return this.prisma.user.create({
      data: {
        adminId,

        storeId: dto.storeId,

        name: dto.name,

        phone: dto.phone,

        pin: await bcrypt.hash(
          dto.pin,
          10,
        ),

        isActive: true,
      },

      select: {
        id: true,
        name: true,
        phone: true,
        storeId: true,
        isActive: true,
        createdAt: true,
      },
    })
  }

  async findAll(
    storeId: string,
  ) {
    return this.prisma.user.findMany({
      where: {
        storeId,
      },

      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(
    id: string,
  ) {
    const cashier =
      await this.prisma.user.findUnique({
        where: {
          id,
        },
      })

    if (!cashier) {
      throw new NotFoundException(
        'Cashier tidak ditemukan',
      )
    }

    return cashier
  }

  async update(
    id: string,
    dto: UpdateCashierDto,
  ) {
    await this.findOne(id)

    const data: any = {}

    if (dto.name)
      data.name = dto.name

    if (dto.phone)
      data.phone = dto.phone

    if (
      dto.isActive !== undefined
    ) {
      data.isActive =
        dto.isActive
    }

    if (dto.pin) {
      data.pin =
        await bcrypt.hash(
          dto.pin,
          10,
        )
    }

    return this.prisma.user.update({
      where: {
        id,
      },

      data,
    })
  }

  async remove(
    id: string,
  ) {
    await this.findOne(id)

    await this.prisma.user.delete({
      where: {
        id,
      },
    })

    return {
      message:
        'Cashier berhasil dihapus',
    }
  }

  async loginPin(
    dto: LoginPinDto,
  ) {
    const cashier =
      await this.prisma.user.findUnique({
        where: {
          id: dto.cashierId,
        },
      })

    if (!cashier) {
      throw new UnauthorizedException(
        'Cashier tidak ditemukan',
      )
    }

    const valid =
      await bcrypt.compare(
        dto.pin,
        cashier.pin,
      )

    if (!valid) {
      throw new UnauthorizedException(
        'PIN salah',
      )
    }

    return {
      message:
        'Kasir aktif',

      transactionAllowed:
        true,

      cashier: {
        id: cashier.id,
        name: cashier.name,
        storeId:
          cashier.storeId,
      },
    }
  }
}