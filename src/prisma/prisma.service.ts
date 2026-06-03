import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();

    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminName || !adminEmail || !adminPassword) {
      this.logger.warn(
        'ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD belum diset',
      );
      return;
    }

    const existingAdmin = await this.admin.findUnique({
      where: {
        email: adminEmail,
      },
    });

    if (existingAdmin) {
      this.logger.log('Admin sudah ada');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await this.admin.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
      },
    });

    this.logger.log(`Admin ${adminEmail} berhasil dibuat`);
  }
}