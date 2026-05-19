// expense/expense.service.ts

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(
    dto: CreateExpenseDto,
    userId?: string,
  ) {
    const outlet =
      await this.prisma.outlet.findUnique({
        where: {
          id: dto.outletId,
        },
      });

    if (!outlet) {
      throw new NotFoundException(
        'Outlet tidak ditemukan',
      );
    }

    const expense =
      await this.prisma.expense.create({
        data: {
          title: dto.title,

          description:
            dto.description,

          type: dto.type,

          amount: dto.amount,

          outletId: dto.outletId,
        },
      });

    if (userId) {
      await this.prisma.activityLog.create({
        data: {
          userId,

          action: 'CREATE',

          entity: 'EXPENSE',

          entityId: expense.id,

          description: `Create expense ${expense.title}`,
        },
      });
    }

    return {
      message:
        'Expense berhasil dibuat',

      data: expense,
    };
  }

  async findAll() {
    return this.prisma.expense.findMany({
      include: {
        outlet: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const expense =
      await this.prisma.expense.findUnique({
        where: {
          id,
        },

        include: {
          outlet: true,
        },
      });

    if (!expense) {
      throw new NotFoundException(
        'Expense tidak ditemukan',
      );
    }

    return expense;
  }

  async update(
    id: string,
    dto: UpdateExpenseDto,
    userId?: string,
  ) {
    const expense =
      await this.prisma.expense.findUnique({
        where: {
          id,
        },
      });

    if (!expense) {
      throw new NotFoundException(
        'Expense tidak ditemukan',
      );
    }

    const updatedExpense =
      await this.prisma.expense.update({
        where: {
          id,
        },

        data: {
          title:
            dto.title ??
            expense.title,

          description:
            dto.description ??
            expense.description,

          type:
            dto.type ??
            expense.type,

          amount:
            dto.amount ??
            expense.amount,
        },
      });

    if (userId) {
      await this.prisma.activityLog.create({
        data: {
          userId,

          action: 'UPDATE',

          entity: 'EXPENSE',

          entityId: expense.id,

          description: `Update expense ${expense.title}`,
        },
      });
    }

    return {
      message:
        'Expense berhasil diupdate',

      data: updatedExpense,
    };
  }

  async remove(
    id: string,
    userId?: string,
  ) {
    const expense =
      await this.prisma.expense.findUnique({
        where: {
          id,
        },
      });

    if (!expense) {
      throw new NotFoundException(
        'Expense tidak ditemukan',
      );
    }

    await this.prisma.expense.delete({
      where: {
        id,
      },
    });

    if (userId) {
      await this.prisma.activityLog.create({
        data: {
          userId,

          action: 'DELETE',

          entity: 'EXPENSE',

          entityId: expense.id,

          description: `Delete expense ${expense.title}`,
        },
      });
    }

    return {
      message:
        'Expense berhasil dihapus',
    };
  }

  async expenseSummary() {
    const expenses =
      await this.prisma.expense.groupBy({
        by: ['type'],

        _sum: {
          amount: true,
        },

        _count: true,
      });

    return expenses;
  }
}
