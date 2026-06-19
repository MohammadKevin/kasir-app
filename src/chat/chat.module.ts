import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { NotificationModule } from '../notification/notification.module'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
