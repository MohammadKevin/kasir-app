import { Injectable } from '@nestjs/common'

import {
    TransactionStatus,
} from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import * as ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

@Injectable()
export class ReportService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    private buildDateRangeFilter(startDate?: string, endDate?: string) {
        if (!startDate && !endDate) return undefined;
        const filter: any = {};
        if (startDate) {
            filter.gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.lte = end;
        }
        return filter;
    }

    async sales(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            storeId,
            status: TransactionStatus.PAID,
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        const transactions =
            await this.prisma.transaction.findMany({
                where,
                include: {
                    cashier: true,
                    customer: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

        const totalSales =
            transactions.reduce(
                (sum, trx) => sum + trx.total,
                0,
            );

        return {
            totalSales,
            totalTransactions: transactions.length,
            data: transactions,
        };
    }

    async expenses(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = { storeId };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        const expenses =
            await this.prisma.expense.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
            });

        const totalExpense =
            expenses.reduce(
                (sum, item) => sum + item.amount,
                0,
            );

        return {
            totalExpense,
            totalData: expenses.length,
            data: expenses,
        };
    }

    async products(
        storeId: string,
    ) {
        return this.prisma.product.findMany({
            where: {
                storeId,
                deletedAt: null,
            },
            orderBy: {
                stock: 'asc',
            },
        });
    }

    async shifts(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = { storeId };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        return this.prisma.shift.findMany({
            where,
            include: {
                user: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async purchases(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = { storeId };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        return this.prisma.purchase.findMany({
            where,
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async salesExcel(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            storeId,
            status: TransactionStatus.PAID,
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        const transactions =
            await this.prisma.transaction.findMany({
                where,
                include: {
                    cashier: true,
                    customer: true,
                },
            });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sales');

        sheet.columns = [
            { header: 'Tanggal', key: 'date' },
            { header: 'Invoice', key: 'invoice' },
            { header: 'Kasir', key: 'cashier' },
            { header: 'Customer', key: 'customer' },
            { header: 'Total', key: 'total' },
        ];

        transactions.forEach((trx) => {
            sheet.addRow({
                date: trx.createdAt,
                invoice: trx.invoiceNumber,
                cashier: trx.cashier.name,
                customer: trx.customer?.name ?? '-',
                total: trx.total,
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async salesPdf(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ): Promise<Buffer> {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            storeId,
            status: TransactionStatus.PAID,
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        const transactions =
            await this.prisma.transaction.findMany({
                where,
                include: {
                    cashier: true,
                    customer: true,
                },
            });

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });

            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on('error', reject);

            doc.fontSize(20);
            doc.text('Sales Report');
            doc.moveDown();

            transactions.forEach((trx) => {
                doc.text(
                    `${trx.invoiceNumber} | ${trx.cashier.name} | Rp ${trx.total}`,
                );
            });

            doc.end();
        });
    }

    async stockMovements(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = { storeId };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        return this.prisma.stockMovement.findMany({
            where,
            include: {
                product: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async profit(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        
        const salesWhere: any = {
            storeId,
            status: TransactionStatus.PAID,
        };
        const expensesWhere: any = { storeId };

        if (dateFilter) {
            salesWhere.createdAt = dateFilter;
            expensesWhere.createdAt = dateFilter;
        }

        const sales =
            await this.prisma.transaction.aggregate({
                _sum: {
                    total: true,
                },
                where: salesWhere,
            });

        const expenses =
            await this.prisma.expense.aggregate({
                _sum: {
                    amount: true,
                },
                where: expensesWhere,
            });

        // Sum COGS dynamically
        const transactions = await this.prisma.transaction.findMany({
            where: salesWhere,
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        let totalCOGS = 0;
        for (const trx of transactions) {
            for (const item of trx.items) {
                const cost = item.product?.costPrice ?? 0;
                totalCOGS += cost * item.quantity;
            }
        }

        const totalSales = sales._sum.total ?? 0;
        const totalOpExpense = expenses._sum.amount ?? 0;

        // totalExpense = COGS + Operational Expenses
        const totalExpense = totalCOGS + totalOpExpense;

        return {
            totalSales,
            totalExpense,
            estimatedProfit: totalSales - totalExpense,
        };
    }
}