import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OutletModule } from './outlet/outlet.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { SaleModule } from './sale/sale.module';
import { ExpenseModule } from './expense/expense.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportModule } from './report/report.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ServeStaticModule.forRoot({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      rootPath: join(process.cwd(), 'uploads'),

      serveRoot: '/uploads',

      serveStaticOptions: {
        index: false,
      },
    }),

    AuthModule,

    UserModule,

    OutletModule,

    CategoryModule,

    ProductModule,

    SaleModule,

    ExpenseModule,

    DashboardModule,

    ReportModule,

    MailModule,

    PrismaModule,

    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
