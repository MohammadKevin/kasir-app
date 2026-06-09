import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(
    adminId: string,
    dto: CreateStoreDto,
  ) {
    const admin =
      await this.prisma.admin.findUnique({
        where: {
          id: adminId,
        },
      });

    if (!admin) {
      throw new UnauthorizedException(
        'Admin tidak ditemukan',
      );
    }

    const exist =
      await this.prisma.store.findUnique({
        where: {
          email: dto.email,
        },
      });

    if (exist) {
      throw new ConflictException(
        'Email store sudah digunakan',
      );
    }

    return this.prisma.store.create({
      data: {
        adminId,

        name: dto.name,

        email: dto.email,

        password:
          await bcrypt.hash(
            dto.password,
            10,
          ),

        phone: dto.phone,

        address: dto.address,

        logo: dto.logo,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll(
    adminId: string,
  ) {
    return this.prisma.store.findMany({
      where: {
        adminId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    id: string,
  ) {
    const store =
      await this.prisma.store.findUnique({
        where: {
          id,
        },

        include: {
          cashiers: true,
          products: true,
          customers: true,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Store tidak ditemukan',
      );
    }

    return store;
  }

  async update(
    id: string,
    dto: UpdateStoreDto,
  ) {
    await this.findOne(id);

    const data: any = {
      ...dto,
    };

    if (dto.password) {
      data.password =
        await bcrypt.hash(
          dto.password,
          10,
        );
    }

    return this.prisma.store.update({
      where: {
        id,
      },

      data,

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(
  adminId: string,
  id: string,
) {
  const store =
    await this.prisma.store.findFirst({
      where: {
        id,
        adminId,
      },
    })

  if (!store) {
    throw new NotFoundException(
      'Store tidak ditemukan',
    )
  }

  await this.prisma.$transaction(
    async (tx) => {
      // 1. Delete cart holds
      await tx.cartHold.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 2. Delete audit logs
      await tx.auditLog.deleteMany({
        where: {
          user: {
            storeId: id,
          },
        },
      })

      // 3. Delete shifts
      await tx.shift.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 4. Delete transaction items
      await tx.transactionItem.deleteMany({
        where: {
          transaction: {
            storeId: id,
          },
        },
      })

      // 5. Delete transactions
      await tx.transaction.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 6. Delete purchase items (if exists in model)
      await tx.purchaseItem.deleteMany({
        where: {
          purchase: {
            storeId: id,
          },
        },
      })

      // 7. Delete purchases (must be deleted before supplier!)
      await tx.purchase.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 8. Delete discount product mappings
      await tx.discountProduct.deleteMany({
        where: {
          OR: [
            {
              product: {
                storeId: id,
              },
            },
            {
              discount: {
                storeId: id,
              },
            },
          ],
        },
      })

      // 9. Delete stock movements
      await tx.stockMovement.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 10. Delete discounts
      await tx.discount.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 11. Delete products
      await tx.product.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 12. Delete categories
      await tx.category.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 13. Delete suppliers (purchases are deleted, so this is safe!)
      await tx.supplier.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 14. Delete customers
      await tx.customer.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 15. Delete expenses
      await tx.expense.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 16. Delete users/cashiers
      await tx.user.deleteMany({
        where: {
          storeId: id,
        },
      })

      // 17. Delete the store itself
      await tx.store.delete({
        where: {
          id,
        },
      })
    },
  )

  return {
    message:
      'Store beserta seluruh data berhasil dihapus',
  }
}
}
