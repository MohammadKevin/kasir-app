import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new NotFoundException('Store tidak ditemukan');
    }

    const exist = await this.prisma.category.findFirst({
      where: {
        storeId: dto.storeId,
        name: dto.name,
      },
    });

    if (exist) {
      throw new ConflictException('Kategori sudah ada');
    }

    return this.prisma.category.create({
      data: {
        storeId: dto.storeId,
        name: dto.name,
        description: dto.description || null,
      },
    });
  }

  async findAll(storeId: string) {
    return this.prisma.category.findMany({
      where: { storeId },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Kategori berhasil dihapus',
    };
  }
}
