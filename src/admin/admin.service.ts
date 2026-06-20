import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(dto: CreateAdminDto) {
    const existAdmin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    const existStore = await this.prisma.store.findUnique({
      where: { email: dto.email },
    });

    if (existAdmin || existStore) {
      throw new ConflictException('Email sudah digunakan oleh akun lain');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.admin.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin tidak ditemukan');
    }

    const totalAdmins = await this.prisma.admin.count();
    if (totalAdmins <= 1) {
      throw new BadRequestException(
        'Tidak dapat menghapus admin terakhir. Harus menyisakan minimal 1 admin.',
      );
    }

    // Cari admin lain untuk menampung toko & kasir agar tidak terhapus (Cascade)
    const otherAdmin = await this.prisma.admin.findFirst({
      where: {
        id: { not: id },
      },
    });

    if (!otherAdmin) {
      throw new BadRequestException(
        'Tidak ditemukan admin pengganti untuk memindahkan kepemilikan data.',
      );
    }

    // Melakukan transfer kepemilikan data dalam transaksi database sebelum menghapus admin lama
    await this.prisma.$transaction(async (tx) => {
      // 1. Pindahkan seluruh toko
      await tx.store.updateMany({
        where: { adminId: id },
        data: { adminId: otherAdmin.id },
      });

      // 2. Pindahkan seluruh kasir/staf admin
      await tx.user.updateMany({
        where: { adminId: id },
        data: { adminId: otherAdmin.id },
      });

      // 3. Hapus sesi login admin yang dihapus
      await tx.session.deleteMany({
        where: {
          userId: id,
          userType: 'ADMIN',
        },
      });

      // 4. Hapus akun admin
      await tx.admin.delete({
        where: { id },
      });
    });

    return {
      message:
        'Admin berhasil dihapus. Seluruh data outlet dan kasir telah dialihkan ke admin pengganti.',
    };
  }
}
