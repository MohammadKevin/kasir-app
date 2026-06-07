import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common'

import {
  PrismaClient,
} from '@prisma/client'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements
    OnModuleInit,
    OnModuleDestroy
{
  findOne(id: string) {
    throw new Error('Method not implemented.')
  }
  cashier: any
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}