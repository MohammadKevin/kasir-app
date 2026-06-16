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

    const expenseDate = dto.createdAt ? new Date(dto.createdAt) : new Date()

    const allocateExpense = async (
      targetDate: Date,
      amountToAllocate: number,
      depth = 0,
    ): Promise<any> => {
      if (amountToAllocate <= 0) return null

      if (depth >= 30) {
        return this.prisma.expense.create({
          data: {
            storeId: dto.storeId,
            title: depth > 0 ? `${dto.title} (Sisa)` : dto.title,
            category: dto.category,
            amount: amountToAllocate,
            createdAt: targetDate,
          },
        })
      }

      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      const salesAgg = await this.prisma.transaction.aggregate({
        _sum: {
          total: true,
        },
        where: {
          storeId: dto.storeId,
          status: 'PAID',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      })
      const dayRevenue = salesAgg._sum.total ?? 0

      const expensesAgg = await this.prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          storeId: dto.storeId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      })
      const dayExpenses = expensesAgg._sum.amount ?? 0

      const availableRevenue = Math.max(0, dayRevenue - dayExpenses)

      if (availableRevenue >= amountToAllocate) {
        return this.prisma.expense.create({
          data: {
            storeId: dto.storeId,
            title: depth > 0 ? `${dto.title} (Alokasi H-${depth})` : dto.title,
            category: dto.category,
            amount: amountToAllocate,
            createdAt: targetDate,
          },
        })
      } else {
        let createdRecord: any = null
        if (availableRevenue > 0) {
          createdRecord = await this.prisma.expense.create({
            data: {
              storeId: dto.storeId,
              title: depth > 0 ? `${dto.title} (Alokasi H-${depth})` : dto.title,
              category: dto.category,
              amount: availableRevenue,
              createdAt: targetDate,
            },
          })
        }

        const prevDate = new Date(targetDate)
        prevDate.setDate(prevDate.getDate() - 1)

        const nextRecord = await allocateExpense(
          prevDate,
          amountToAllocate - availableRevenue,
          depth + 1,
        )

        return createdRecord || nextRecord
      }
    }

    return allocateExpense(expenseDate, dto.amount)
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