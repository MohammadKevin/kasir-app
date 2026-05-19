import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

@Injectable()
export class OutletService {
  constructor(
    private prisma: PrismaService,

    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    dto: CreateOutletDto,

    file?: Express.Multer.File,
  ) {
    const existingOutlet =
      await this.prisma.outlet.findFirst({
        where: {
          name: dto.name,
        },
      });

    if (existingOutlet) {
      throw new BadRequestException(
        'Outlet sudah ada',
      );
    }

    let qrisImage: string | undefined;

    if (file) {
      qrisImage =
        await this.cloudinaryService.uploadFile(
          file,
        );
    }

    const outlet =
      await this.prisma.outlet.create({
        data: {
          name: dto.name,

          address: dto.address,

          noTelp: dto.noTelp,

          qrisImage,
        },
      });

    return {
      message:
        'Outlet berhasil dibuat',

      data: outlet,
    };
  }

  async findAll() {
    return this.prisma.outlet.findMany({
      where: {
        isActive: true,
      },

      include: {
        users: true,

        _count: {
          select: {
            products: true,

            sales: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const outlet =
      await this.prisma.outlet.findUnique({
        where: {
          id,
        },

        include: {
          users: true,

          products: true,

          sales: {
            take: 10,

            orderBy: {
              createdAt: 'desc',
            },
          },

          expenses: true,

          shifts: true,
        },
      });

    if (!outlet) {
      throw new NotFoundException(
        'Outlet tidak ditemukan',
      );
    }

    return outlet;
  }

  async update(
    id: string,

    dto: UpdateOutletDto,

    file?: Express.Multer.File,
  ) {
    const outlet =
      await this.prisma.outlet.findUnique({
        where: {
          id,
        },
      });

    if (!outlet) {
      throw new NotFoundException(
        'Outlet tidak ditemukan',
      );
    }

    let qrisImage =
      outlet.qrisImage;

    if (file) {
      qrisImage =
        await this.cloudinaryService.uploadFile(
          file,
        );
    }

    const updatedOutlet =
      await this.prisma.outlet.update({
        where: {
          id,
        },

        data: {
          name:
            dto.name ??
            outlet.name,

          address:
            dto.address ??
            outlet.address,

          noTelp:
            dto.noTelp ??
            outlet.noTelp,

          qrisImage,
        },
      });

    return {
      message:
        'Outlet berhasil diupdate',

      data: updatedOutlet,
    };
  }

  async remove(id: string) {
    const outlet =
      await this.prisma.outlet.findUnique({
        where: {
          id,
        },

        include: {
          sales: true,

          products: true,

          users: true,
        },
      });

    if (!outlet) {
      throw new NotFoundException(
        'Outlet tidak ditemukan',
      );
    }

    if (outlet.sales.length > 0) {
      throw new BadRequestException(
        'Outlet memiliki transaksi dan tidak bisa dihapus',
      );
    }

    await this.prisma.outlet.update({
      where: {
        id,
      },

      data: {
        isActive: false,
      },
    });

    return {
      message:
        'Outlet berhasil dihapus',
    };
  }
}
