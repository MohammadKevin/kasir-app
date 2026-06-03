import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateExpenseDto,
  ) {
    const store =
      await this.prisma.store.findUnique({
        where: {
          id: dto.storeId,
        },
      })

    if (!store) {
      throw new NotFoundException(
        'Store tidak ditemukan',
      )
    }

    return this.prisma.expense.create({
      data: dto,
    })
  }

  async findAll(
    storeId: string,
  ) {
    return this.prisma.expense.findMany({
      where: {
        storeId,
      },

      orderBy: {
        createdAt:
          'desc',
      },
    })
  }

  async findOne(
    id: string,
  ) {
    const expense =
      await this.prisma.expense.findUnique({
        where: {
          id,
        },
      })

    if (!expense) {
      throw new NotFoundException(
        'Expense tidak ditemukan',
      )
    }

    return expense
  }

  async update(
    id: string,
    dto: UpdateExpenseDto,
  ) {
    await this.findOne(id)

    return this.prisma.expense.update({
      where: {
        id,
      },

      data: dto,
    })
  }

  async remove(
    id: string,
  ) {
    await this.findOne(id)

    await this.prisma.expense.delete({
      where: {
        id,
      },
    })

    return {
      message:
        'Expense berhasil dihapus',
    }
  }

  async summary(
    storeId: string,
  ) {
    const result =
      await this.prisma.expense.aggregate({
        _sum: {
          amount: true,
        },

        where: {
          storeId,
        },
      })

    return {
      totalExpense:
        result._sum.amount ?? 0,
    }
  }
}