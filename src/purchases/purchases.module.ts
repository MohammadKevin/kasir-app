import { Module } from '@nestjs/common';

import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';

import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
