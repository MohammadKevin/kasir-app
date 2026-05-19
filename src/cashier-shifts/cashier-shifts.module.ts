import { Module } from '@nestjs/common';
import { CashierShiftsService } from './cashier-shifts.service';
import { CashierShiftsController } from './cashier-shifts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CashierShiftsController],
  providers: [CashierShiftsService],
})
export class CashierShiftsModule {}