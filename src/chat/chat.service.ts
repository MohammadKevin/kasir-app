import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async sendMessage(
    senderId: string,
    senderType: string,
    senderName: string,
    receiverId: string,
    receiverType: string,
    content: string,
  ) {
    const message = await this.prisma.chatMessage.create({
      data: {
        senderId,
        senderType,
        senderName,
        receiverId,
        receiverType,
        content,
      },
    })

    // Create a notification for the recipient
    await this.notificationService.create(
      receiverId,
      receiverType,
      'Pesan Baru',
      `${senderName}: "${content.slice(0, 40)}${content.length > 40 ? '...' : ''}"`,
    ).catch(err => {
      console.warn('Failed to generate notification for new message:', err.message)
    })

    return message
  }

  async getMessages(
    userId: string,
    userType: string,
    receiverId: string,
    receiverType: string,
  ) {
    return this.prisma.chatMessage.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            senderType: userType,
            receiverId,
            receiverType,
          },
          {
            senderId: receiverId,
            senderType: receiverType,
            receiverId: userId,
            receiverType: userType,
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  async getContacts(userId: string, userType: string) {
    if (userType === 'ADMIN') {
      // Admin sees all Stores they manage
      const stores = await this.prisma.store.findMany({
        where: { adminId: userId },
        select: {
          id: true,
          name: true,
        },
      })
      return stores.map(store => ({
        id: store.id,
        name: store.name,
        type: 'STORE',
      }))
    } else {
      // Store sees the Admin and other Stores under the same Admin
      const store = await this.prisma.store.findUnique({
        where: { id: userId },
        select: { adminId: true },
      })

      if (!store) {
        throw new NotFoundException('Store tidak ditemukan')
      }

      const contacts: { id: string; name: string; type: string }[] = []

      // Get Admin contact
      const admin = await this.prisma.admin.findUnique({
        where: { id: store.adminId },
        select: { id: true, name: true },
      })

      if (admin) {
        contacts.push({
          id: admin.id,
          name: `${admin.name} (Pusat)`,
          type: 'ADMIN',
        })
      }

      // Get peer Stores under same Admin
      const siblingStores = await this.prisma.store.findMany({
        where: {
          adminId: store.adminId,
          NOT: { id: userId },
        },
        select: { id: true, name: true },
      })

      siblingStores.forEach(s => {
        contacts.push({
          id: s.id,
          name: s.name,
          type: 'STORE',
        })
      })

      return contacts
    }
  }
}
