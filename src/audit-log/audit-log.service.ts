import { Injectable } from '@nestjs/common';

import { AuditAction } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, action: AuditAction) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
      },
    });
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      include: {
        user: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
      },

      include: {
        user: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
