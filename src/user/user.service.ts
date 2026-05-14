import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        outlet: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        outlet: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    await this.prisma.user.delete({
      where: {
        id,
      },
    });

    return {
      message: 'User berhasil dihapus',
    };
  }
}
