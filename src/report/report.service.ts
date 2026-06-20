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
            { header: 'Diskon', key: 'discount' },
            { header: 'Total', key: 'total' },
        ];

        transactions.forEach((trx) => {
            sheet.addRow({
                date: trx.createdAt,
                invoice: trx.invoiceNumber,
                cashier: trx.cashier.name,
                customer: trx.customer?.name ?? '-',
                discount: trx.totalDiscount,
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
                const discText = trx.totalDiscount > 0 ? ` | Diskon: Rp ${trx.totalDiscount.toLocaleString('id-ID')}` : '';
                doc.text(
                    `${trx.invoiceNumber} | ${trx.cashier.name}${discText} | Rp ${trx.total.toLocaleString('id-ID')}`,
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

    async salesByOutlet(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { adminId: true }
        });
        if (!store) return [];

        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            store: { adminId: store.adminId },
            status: TransactionStatus.PAID,
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            include: {
                store: { select: { name: true } }
            }
        });

        const storeSalesMap = new Map<string, { storeName: string, totalSales: number, count: number }>();
        for (const trx of transactions) {
            const storeName = trx.store.name;
            const current = storeSalesMap.get(storeName) || { storeName, totalSales: 0, count: 0 };
            current.totalSales += trx.total;
            current.count += 1;
            storeSalesMap.set(storeName, current);
        }

        return Array.from(storeSalesMap.values());
    }

    async salesByDate(
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

        const transactions = await this.prisma.transaction.findMany({
            where,
            select: {
                createdAt: true,
                total: true
            }
        });

        const dateSalesMap = new Map<string, { date: string, totalSales: number, count: number }>();
        for (const trx of transactions) {
            const dateStr = trx.createdAt.toISOString().split('T')[0];
            const current = dateSalesMap.get(dateStr) || { date: dateStr, totalSales: 0, count: 0 };
            current.totalSales += trx.total;
            current.count += 1;
            dateSalesMap.set(dateStr, current);
        }

        return Array.from(dateSalesMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    }

    async salesByHour(
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

        const transactions = await this.prisma.transaction.findMany({
            where,
            select: {
                createdAt: true,
                total: true
            }
        });

        const hourlySalesMap = new Map<number, { hour: string, totalSales: number, count: number }>();
        for (let i = 0; i < 24; i++) {
            hourlySalesMap.set(i, { hour: `${String(i).padStart(2, '0')}:00`, totalSales: 0, count: 0 });
        }

        for (const trx of transactions) {
            const hour = trx.createdAt.getHours();
            const current = hourlySalesMap.get(hour);
            if (current) {
                current.totalSales += trx.total;
                current.count += 1;
            }
        }

        return Array.from(hourlySalesMap.values());
    }

    async salesByCategory(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            transaction: {
                storeId,
                status: TransactionStatus.PAID
            }
        };
        if (dateFilter) {
            where.transaction.createdAt = dateFilter;
        }

        const items = await this.prisma.transactionItem.findMany({
            where,
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        });

        const categorySalesMap = new Map<string, { categoryName: string, totalSales: number, quantity: number }>();
        for (const item of items) {
            const categoryName = item.product?.category?.name ?? 'Uncategorized';
            const current = categorySalesMap.get(categoryName) || { categoryName, totalSales: 0, quantity: 0 };
            current.totalSales += item.subtotal;
            current.quantity += item.quantity;
            categorySalesMap.set(categoryName, current);
        }

        return Array.from(categorySalesMap.values()).sort((a, b) => b.totalSales - a.totalSales);
    }

    async salesByCustomer(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            storeId,
            status: TransactionStatus.PAID,
            customerId: { not: null }
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            include: {
                customer: true
            }
        });

        const customerSalesMap = new Map<string, { customerName: string, phone: string, totalSpent: number, count: number }>();
        for (const trx of transactions) {
            if (!trx.customer) continue;
            const customerId = trx.customer.id;
            const current = customerSalesMap.get(customerId) || {
                customerName: trx.customer.name,
                phone: trx.customer.phone ?? '-',
                totalSpent: 0,
                count: 0
            };
            current.totalSpent += trx.total;
            current.count += 1;
            customerSalesMap.set(customerId, current);
        }

        return Array.from(customerSalesMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    }

    async salesByPaymentMethod(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            storeId,
            status: TransactionStatus.PAID
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            select: {
                paymentMethod: true,
                total: true
            }
        });

        const paymentMap = new Map<string, { method: string, totalSales: number, count: number }>();
        for (const trx of transactions) {
            const method = trx.paymentMethod;
            const current = paymentMap.get(method) || { method, totalSales: 0, count: 0 };
            current.totalSales += trx.total;
            current.count += 1;
            paymentMap.set(method, current);
        }

        return Array.from(paymentMap.values()).sort((a, b) => b.totalSales - a.totalSales);
    }

    async taxes(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            storeId,
            status: TransactionStatus.PAID,
            taxAmount: { gt: 0 }
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        return this.prisma.transaction.findMany({
            where,
            select: {
                createdAt: true,
                invoiceNumber: true,
                total: true,
                taxAmount: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async promos(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            storeId,
            status: TransactionStatus.PAID,
            totalDiscount: { gt: 0 }
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        return this.prisma.transaction.findMany({
            where,
            select: {
                createdAt: true,
                invoiceNumber: true,
                total: true,
                totalDiscount: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async dailyProfit(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const salesWhere: any = {
            storeId,
            status: TransactionStatus.PAID
        };
        const expensesWhere: any = { storeId };
        if (dateFilter) {
            salesWhere.createdAt = dateFilter;
            expensesWhere.createdAt = dateFilter;
        }

        const transactions = await this.prisma.transaction.findMany({
            where: salesWhere,
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        const expenses = await this.prisma.expense.findMany({
            where: expensesWhere
        });

        const dailyMap = new Map<string, { date: string, revenue: number, cogs: number, expense: number, profit: number }>();

        for (const trx of transactions) {
            const dateStr = trx.createdAt.toISOString().split('T')[0];
            const current = dailyMap.get(dateStr) || { date: dateStr, revenue: 0, cogs: 0, expense: 0, profit: 0 };
            current.revenue += trx.total;
            for (const item of trx.items) {
                current.cogs += (item.product?.costPrice ?? 0) * item.quantity;
            }
            dailyMap.set(dateStr, current);
        }

        for (const ex of expenses) {
            const dateStr = ex.createdAt.toISOString().split('T')[0];
            const current = dailyMap.get(dateStr) || { date: dateStr, revenue: 0, cogs: 0, expense: 0, profit: 0 };
            current.expense += ex.amount;
            dailyMap.set(dateStr, current);
        }

        for (const [dateStr, current] of dailyMap.entries()) {
            current.profit = current.revenue - (current.cogs + current.expense);
        }

        return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    }

    async productProfit(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            transaction: {
                storeId,
                status: TransactionStatus.PAID
            }
        };
        if (dateFilter) {
            where.transaction.createdAt = dateFilter;
        }

        const items = await this.prisma.transactionItem.findMany({
            where,
            include: {
                product: true
            }
        });

        const productProfitMap = new Map<string, { productName: string, sku: string, quantity: number, revenue: number, cost: number, profit: number }>();

        for (const item of items) {
            const productId = item.productId;
            const current = productProfitMap.get(productId) || {
                productName: item.product?.name ?? 'Unknown Product',
                sku: item.product?.sku ?? '-',
                quantity: 0,
                revenue: 0,
                cost: 0,
                profit: 0
            };
            current.quantity += item.quantity;
            current.revenue += item.subtotal;
            current.cost += (item.product?.costPrice ?? 0) * item.quantity;
            productProfitMap.set(productId, current);
        }

        for (const [prodId, current] of productProfitMap.entries()) {
            current.profit = current.revenue - current.cost;
        }

        return Array.from(productProfitMap.values()).sort((a, b) => b.profit - a.profit);
    }

    async attendance(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            user: { storeId }
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        return this.prisma.attendance.findMany({
            where,
            include: {
                user: true
            },
            orderBy: {
                clockIn: 'desc'
            }
        });
    }

    async commission(
        storeId: string,
        startDate?: string,
        endDate?: string,
    ) {
        const dateFilter = this.buildDateRangeFilter(startDate, endDate);
        const where: any = {
            storeId,
            status: TransactionStatus.PAID
        };
        if (dateFilter) {
            where.createdAt = dateFilter;
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            include: {
                cashier: true
            }
        });

        const commissionMap = new Map<string, { cashierName: string, count: number, sales: number, commission: number }>();

        for (const trx of transactions) {
            const cashierId = trx.cashierId;
            const current = commissionMap.get(cashierId) || {
                cashierName: trx.cashier.name,
                count: 0,
                sales: 0,
                commission: 0
            };
            current.count += 1;
            current.sales += trx.total;
            commissionMap.set(cashierId, current);
        }

        for (const [cashierId, current] of commissionMap.entries()) {
            current.commission = Math.round(current.sales * 0.01);
        }

        return Array.from(commissionMap.values()).sort((a, b) => b.commission - a.commission);
    }
}