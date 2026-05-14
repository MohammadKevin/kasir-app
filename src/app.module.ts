import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
