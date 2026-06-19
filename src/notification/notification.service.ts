import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, userType: string, title: string, content: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        userType,
        title,
        content,
        isRead: false,
      },
    })
  }

  async findAll(userId: string, userType: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        userType,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async markAsRead(id: string, userId: string, userType: string) {
    const notif = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
        userType,
      },
    })

    if (!notif) {
      throw new NotFoundException('Notifikasi tidak ditemukan')
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })
  }

  async markAllAsRead(userId: string, userType: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        userType,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
  }
}
