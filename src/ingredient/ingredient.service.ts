import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIngredientDto } from './dto/create-ingredient.dto'
import { UpdateIngredientDto } from './dto/update-ingredient.dto'
import { UpdateRecipeDto } from './dto/update-recipe.dto'

@Injectable()
export class IngredientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIngredientDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
    })

    if (!store) {
      throw new NotFoundException('Store tidak ditemukan')
    }

    return this.prisma.ingredient.create({
      data: {
        storeId: dto.storeId,
        name: dto.name,
        stock: dto.stock,
        unit: dto.unit,
      },
    })
  }

  async findAll(storeId: string) {
    return this.prisma.ingredient.findMany({
      where: { storeId },
      orderBy: {
        name: 'asc',
      },
    })
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    })

    if (!ingredient) {
      throw new NotFoundException('Bahan baku tidak ditemukan')
    }

    return ingredient
  }

  async update(id: string, dto: UpdateIngredientDto) {
    await this.findOne(id)

    return this.prisma.ingredient.update({
      where: { id },
      data: {
        name: dto.name,
        stock: dto.stock,
        unit: dto.unit,
      },
    })
  }

  async remove(id: string) {
    await this.findOne(id)

    await this.prisma.ingredient.delete({
      where: { id },
    })

    return {
      message: 'Bahan baku berhasil dihapus',
    }
  }

  async getRecipe(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan')
    }

    return this.prisma.productIngredient.findMany({
      where: { productId },
      include: {
        ingredient: true,
      },
    })
  }

  async updateRecipe(productId: string, dto: UpdateRecipeDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan')
    }

    // Gunakan transaction untuk menghapus recipe lama dan menggantinya dengan yang baru
    return this.prisma.$transaction(async (tx) => {
      // Hapus yang lama
      await tx.productIngredient.deleteMany({
        where: { productId },
      })

      // Jika ada item baru, masukkan
      if (dto.items && dto.items.length > 0) {
        await tx.productIngredient.createMany({
          data: dto.items.map((item) => ({
            productId,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
          })),
        })
      }

      return tx.productIngredient.findMany({
        where: { productId },
        include: {
          ingredient: true,
        },
      })
    })
  }
}
