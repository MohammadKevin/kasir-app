import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        name: dto.name,
      },
    });

    if (existingCategory) {
      throw new BadRequestException('Category sudah ada');
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
      },
    });

    return {
      message: 'Category berhasil dibuat',

      data: category,
    };
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },

      include: {
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category tidak ditemukan');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundException('Category tidak ditemukan');
    }

    const updatedCategory = await this.prisma.category.update({
      where: {
        id,
      },

      data: {
        name: dto.name,
      },
    });

    return {
      message: 'Category berhasil diupdate',

      data: updatedCategory,
    };
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundException('Category tidak ditemukan');
    }

    await this.prisma.category.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Category berhasil dihapus',
    };
  }
}
