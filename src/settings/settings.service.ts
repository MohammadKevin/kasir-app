import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings =
      await this.prisma.appSetting.findFirst();

    if (!settings) {
      settings =
        await this.prisma.appSetting.create({
          data: {
            storeName: 'Kasir App',
          },
        });
    }

    return settings;
  }

  async updateSettings(
    dto: UpdateSettingsDto,
  ) {
    const settings =
      await this.prisma.appSetting.findFirst();

    if (!settings) {
      throw new NotFoundException(
        'Settings tidak ditemukan',
      );
    }

    return this.prisma.appSetting.update({
      where: {
        id: settings.id,
      },

      data: {
        storeName: dto.storeName,

        logo: dto.logo,

        phone: dto.phone,

        address: dto.address,

        receiptFooter:
          dto.receiptFooter,

        taxPercentage:
          dto.taxPercentage,
      },
    });
  }
}