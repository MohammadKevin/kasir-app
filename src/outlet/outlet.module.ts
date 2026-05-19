import { Module } from '@nestjs/common';

import { OutletService } from './outlet.service';
import { OutletController } from './outlet.controller';

import { PrismaModule } from 'src/prisma/prisma.module';

import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
  ],

  controllers: [OutletController],

  providers: [OutletService],
})
export class OutletModule {}