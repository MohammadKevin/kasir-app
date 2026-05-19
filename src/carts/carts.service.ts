import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateCartDto } from './dto/create-cart.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(private prisma: PrismaService) {}

  async create(createCartDto: CreateCartDto) {
    const cartCount = await this.prisma.cart.count();

    return this.prisma.cart.create({
      data: {
        cartNumber: `CART-${String(cartCount + 1).padStart(4, '0')}`,
        outletId: createCartDto.outletId,
        cashierId: createCartDto.cashierId,
        customerId: createCartDto.customerId,
      },
    });
  }

  async findAll() {
    return this.prisma.cart.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        cashier: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        cashier: true,
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart tidak ditemukan');
    }

    return cart;
  }

  async addItem(cartId: string, dto: AddCartItemDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart) {
      throw new NotFoundException('Cart tidak ditemukan');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product tidak ditemukan');
    }

    const subtotal = dto.quantity * dto.price;

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: dto.productId,
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + dto.quantity,
          subtotal:
            (existingItem.quantity + dto.quantity) * dto.price,
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId,
        productId: dto.productId,
        quantity: dto.quantity,
        price: dto.price,
        subtotal,
      },
    });
  }

  async removeItem(itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!item) {
      throw new NotFoundException('Item tidak ditemukan');
    }

    await this.prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });

    return {
      message: 'Item berhasil dihapus',
    };
  }

  async holdCart(id: string) {
    return this.prisma.cart.update({
      where: { id },
      data: {
        status: 'HOLD',
        heldAt: new Date(),
      },
    });
  }

  async completeCart(id: string) {
    return this.prisma.cart.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
    });

    if (!cart) {
      throw new NotFoundException('Cart tidak ditemukan');
    }

    await this.prisma.cart.delete({
      where: { id },
    });

    return {
      message: 'Cart berhasil dihapus',
    };
  }
}