import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TableService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTableDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new NotFoundException('Store tidak ditemukan');
    }

    const exist = await this.prisma.table.findFirst({
      where: {
        storeId: dto.storeId,
        number: dto.number,
      },
    });

    if (exist) {
      throw new ConflictException('Nomor meja sudah terdaftar di outlet ini');
    }

    return this.prisma.table.create({
      data: {
        storeId: dto.storeId,
        number: dto.number,
        capacity: dto.capacity ?? 4,
        status: 'AVAILABLE',
      },
    });
  }

  async findAll(storeId: string) {
    return this.prisma.table.findMany({
      where: { storeId },
      orderBy: {
        number: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException('Meja tidak ditemukan');
    }

    return table;
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);

    return this.prisma.table.update({
      where: { id },
      data: {
        number: dto.number,
        capacity: dto.capacity,
        status: dto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.table.delete({
      where: { id },
    });

    return {
      message: 'Meja berhasil dihapus',
    };
  }
}
