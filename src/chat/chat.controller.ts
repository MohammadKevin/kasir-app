import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard'
import { ChatService } from './chat.service'

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('contacts')
  getContacts(@Req() req: any) {
    return this.chatService.getContacts(req.user.id, req.user.type)
  }

  @Get('messages/:receiverId/:receiverType')
  getMessages(
    @Param('receiverId') receiverId: string,
    @Param('receiverType') receiverType: string,
    @Req() req: any
  ) {
    return this.chatService.getMessages(req.user.id, req.user.type, receiverId, receiverType)
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @Req() req: any,
    @Body() body: { receiverId: string; receiverType: string; content: string; senderName?: string }
  ) {
    const senderName = body.senderName || req.user.name || 'User'
    return this.chatService.sendMessage(
      req.user.id,
      req.user.type,
      senderName,
      body.receiverId,
      body.receiverType,
      body.content
    )
  }
}
