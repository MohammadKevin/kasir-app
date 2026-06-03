import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module';
import { StoreModule } from './store/store.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { CustomerModule } from './customer/customer.module';
import { SupplierModule } from './supplier/supplier.module';
import { TransactionModule } from './transaction/transaction.module';
import { ExpenseModule } from './expense/expense.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DiscountModule } from './discount/discount.module';
import { ShiftModule } from './shift/shift.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { UploadModule } from './upload/upload.module';
import { CashierModule } from './cashier/cashier.module';
import { StockMovementModule } from './stock-movement/stock-movement.module';
import { PurchaseModule } from './purchase/purchase.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    StoreModule,
    UserModule,
    CategoryModule,
    ProductModule,
    CustomerModule,
    SupplierModule,
    TransactionModule,
    ExpenseModule,
    DashboardModule,
    DiscountModule,
    ShiftModule,
    AuditLogModule,
    UploadModule,
    CashierModule,
    StockMovementModule,
    PurchaseModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}