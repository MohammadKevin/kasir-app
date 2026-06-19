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
import { VerifyAdminPinDto } from './dto/verify-admin-pin.dto'

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
          storeId:
            dto.storeId,

          OR: [
            {
              name:
                dto.name,
            },
            {
              phone:
                dto.phone,
            },
          ],
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

        storeId:
          dto.storeId,

        name:
          dto.name,

        phone:
          dto.phone,

        pin:
          await bcrypt.hash(
            dto.pin,
            10,
          ),

        isActive:
          true,

        isStoreAdmin:
          dto.isStoreAdmin ?? false,
      },

      select: {
        id: true,
        name: true,
        phone: true,
        storeId: true,
        isActive: true,
        isStoreAdmin: true,
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
        deletedAt: null,
      },

      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        isStoreAdmin: true,
        createdAt: true,
      },

      orderBy: {
        createdAt:
          'desc',
      },
    })
  }

  async findOne(
    id: string,
  ) {
    const cashier =
      await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
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
      data.name =
        dto.name

    if (dto.phone)
      data.phone =
        dto.phone

    if (
      dto.isActive !==
      undefined
    ) {
      data.isActive =
        dto.isActive
    }

    if (
      dto.isStoreAdmin !==
      undefined
    ) {
      data.isStoreAdmin =
        dto.isStoreAdmin
    }

    if (
      dto.pin
    ) {
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
    await this.findOne(
      id,
    )

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
        pin: `deleted-${id}-${Date.now()}`,
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
      await this.prisma.user.findFirst({
        where: {
          id: dto.cashierId,
          deletedAt: null,
        },
      })

    if (
      !cashier
    ) {
      throw new UnauthorizedException(
        'Cashier tidak ditemukan',
      )
    }

    if (
      !cashier.isActive
    ) {
      throw new UnauthorizedException(
        'Cashier nonaktif',
      )
    }

    const valid =
      await bcrypt.compare(
        dto.pin,
        cashier.pin,
      )

    if (
      !valid
    ) {
      throw new UnauthorizedException(
        'PIN salah',
      )
    }

    // Auto Clock-In or Reopen today's attendance
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const existingToday = await this.prisma.attendance.findFirst({
      where: {
        userId: cashier.id,
        clockIn: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    if (existingToday) {
      if (existingToday.clockOut !== null) {
        await this.prisma.attendance.update({
          where: { id: existingToday.id },
          data: {
            clockOut: null,
          },
        })
      }
    } else {
      await this.prisma.attendance.create({
        data: {
          userId: cashier.id,
          clockIn: new Date(),
        },
      })
    }

    return {
      success:
        true,

      message:
        'Kasir aktif',

      transactionAllowed:
        true,

      session: {
        active:
          true,

        startedAt:
          new Date(),
      },

      cashier: {
        id:
          cashier.id,

        name:
          cashier.name,

        phone:
          cashier.phone,

        storeId:
          cashier.storeId,

        isStoreAdmin:
          cashier.isStoreAdmin,
      },
    }
  }

  async verifyAdminPin(
    dto: VerifyAdminPinDto,
  ) {
    const cashiers =
      await this.prisma.user.findMany({
        where: {
          storeId:
            dto.storeId,

          isStoreAdmin:
            true,

          deletedAt:
            null,

          isActive:
            true,
        },
      })

    for (const cashier of cashiers) {
      const valid =
        await bcrypt.compare(
          dto.pin,
          cashier.pin,
        )

      if (valid) {
        return {
          success:
            true,

          cashier: {
            id:
              cashier.id,

            name:
              cashier.name,

            phone:
              cashier.phone,

            storeId:
              cashier.storeId,

            isStoreAdmin:
              cashier.isStoreAdmin,
          },
        }
      }
    }

    throw new UnauthorizedException(
      'PIN Admin Store tidak valid atau tidak memiliki hak akses!',
    )
  }
}