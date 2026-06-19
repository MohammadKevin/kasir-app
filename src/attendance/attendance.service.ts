import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ClockDto } from './dto/clock.dto'

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async clockIn(dto: ClockDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    })

    if (!user) {
      throw new NotFoundException('User tidak ditemukan')
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const existingToday = await this.prisma.attendance.findFirst({
      where: {
        userId: dto.userId,
        clockIn: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    if (existingToday) {
      if (existingToday.clockOut === null) {
        throw new BadRequestException('Karyawan sudah melakukan clock-in')
      }
      return this.prisma.attendance.update({
        where: { id: existingToday.id },
        data: {
          clockOut: null,
        },
        include: {
          user: true,
        },
      })
    }

    return this.prisma.attendance.create({
      data: {
        userId: dto.userId,
        clockIn: new Date(),
      },
      include: {
        user: true,
      },
    })
  }

  async clockOut(dto: ClockDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    })

    if (!user) {
      throw new NotFoundException('User tidak ditemukan')
    }

    const active = await this.prisma.attendance.findFirst({
      where: {
        userId: dto.userId,
        clockOut: null,
      },
      orderBy: {
        clockIn: 'desc',
      },
    })

    if (!active) {
      throw new BadRequestException('Karyawan belum melakukan clock-in atau shift sudah ditutup')
    }

    return this.prisma.attendance.update({
      where: { id: active.id },
      data: {
        clockOut: new Date(),
      },
      include: {
        user: true,
      },
    })
  }

  async getStatus(userId: string) {
    const active = await this.prisma.attendance.findFirst({
      where: {
        userId,
        clockOut: null,
      },
    })

    return {
      isClockedIn: !!active,
      attendance: active || null,
    }
  }

  async findAllByStore(storeId: string) {
    return this.prisma.attendance.findMany({
      where: {
        user: {
          storeId,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        clockIn: 'desc',
      },
    })
  }

  async openStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    })

    if (!store) {
      throw new NotFoundException('Store tidak ditemukan')
    }

    const active = await this.prisma.storeAttendance.findFirst({
      where: {
        storeId,
        closeTime: null,
      },
    })

    if (active) {
      throw new BadRequestException('Toko sudah dibuka')
    }

    return this.prisma.storeAttendance.create({
      data: {
        storeId,
        openTime: new Date(),
      },
    })
  }

  async closeStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    })

    if (!store) {
      throw new NotFoundException('Store tidak ditemukan')
    }

    const active = await this.prisma.storeAttendance.findFirst({
      where: {
        storeId,
        closeTime: null,
      },
      orderBy: {
        openTime: 'desc',
      },
    })

    if (!active) {
      throw new BadRequestException('Toko belum dibuka')
    }

    return this.prisma.storeAttendance.update({
      where: { id: active.id },
      data: {
        closeTime: new Date(),
      },
    })
  }

  async getStoreStatus(storeId: string) {
    const active = await this.prisma.storeAttendance.findFirst({
      where: {
        storeId,
        closeTime: null,
      },
    })

    return {
      isOpen: !!active,
      attendance: active || null,
    }
  }

  async findStoreAttendanceHistory(storeId: string) {
    return this.prisma.storeAttendance.findMany({
      where: {
        storeId,
      },
      orderBy: {
        openTime: 'desc',
      },
    })
  }
}

