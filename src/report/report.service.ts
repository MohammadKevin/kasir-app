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

    async sales(
        storeId: string,
    ) {
        const transactions =
            await this.prisma.transaction.findMany({
                where: {
                    storeId,
                    status:
                        TransactionStatus.PAID,
                },

                include: {
                    cashier: true,
                    customer: true,
                },

                orderBy: {
                    createdAt:
                        'desc',
                },
            })

        const totalSales =
            transactions.reduce(
                (sum, trx) =>
                    sum + trx.total,
                0,
            )

        return {
            totalSales,
            totalTransactions:
                transactions.length,
            data: transactions,
        }
    }

    async expenses(
        storeId: string,
    ) {
        const expenses =
            await this.prisma.expense.findMany({
                where: {
                    storeId,
                },

                orderBy: {
                    createdAt:
                        'desc',
                },
            })

        const totalExpense =
            expenses.reduce(
                (sum, item) =>
                    sum + item.amount,
                0,
            )

        return {
            totalExpense,
            totalData:
                expenses.length,
            data: expenses,
        }
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
        })
    }

    async shifts(
        storeId: string,
    ) {
        return this.prisma.shift.findMany({
            where: {
                storeId,
            },

            include: {
                user: true,
            },

            orderBy: {
                createdAt:
                    'desc',
            },
        })
    }

    async purchases(
        storeId: string,
    ) {
        return this.prisma.purchase.findMany({
            where: {
                storeId,
            },

            include: {
                supplier: true,

                items: {
                    include: {
                        product: true,
                    },
                },
            },

            orderBy: {
                createdAt:
                    'desc',
            },
        })
    }

    async salesExcel(
        storeId: string,
    ) {
        const transactions =
            await this.prisma.transaction.findMany({
                where: {
                    storeId,
                },

                include: {
                    cashier: true,
                    customer: true,
                },
            })

        const workbook =
            new ExcelJS.Workbook()

        const sheet =
            workbook.addWorksheet(
                'Sales',
            )

        sheet.columns = [
            {
                header: 'Tanggal',
                key: 'date',
            },
            {
                header: 'Invoice',
                key: 'invoice',
            },
            {
                header: 'Kasir',
                key: 'cashier',
            },
            {
                header: 'Customer',
                key: 'customer',
            },
            {
                header: 'Total',
                key: 'total',
            },
        ]

        transactions.forEach(
            (trx) => {
                sheet.addRow({
                    date:
                        trx.createdAt,

                    invoice:
                        trx.invoiceNumber,

                    cashier:
                        trx.cashier.name,

                    customer:
                        trx.customer?.name ??
                        '-',

                    total:
                        trx.total,
                })
            },
        )

        const buffer =
            await workbook.xlsx.writeBuffer()

        return Buffer.from(
            buffer,
        )
    }

    async salesPdf(
        storeId: string,
    ): Promise<Buffer> {
        const transactions =
            await this.prisma.transaction.findMany({
                where: {
                    storeId,
                },

                include: {
                    cashier: true,
                    customer: true,
                },
            })

        return new Promise(
            (
                resolve,
                reject,
            ) => {
                const doc =
                    new PDFDocument()

                const chunks: Buffer[] =
                    []

                doc.on(
                    'data',
                    (
                        chunk,
                    ) => {
                        chunks.push(chunk)
                    },
                )

                doc.on(
                    'end',
                    () => {
                        resolve(
                            Buffer.concat(
                                chunks,
                            ),
                        )
                    },
                )

                doc.on(
                    'error',
                    reject,
                )

                doc.fontSize(20)

                doc.text(
                    'Sales Report',
                )

                doc.moveDown()

                transactions.forEach(
                    (
                        trx,
                    ) => {
                        doc.text(
                            `${trx.invoiceNumber} | ${trx.cashier.name} | Rp ${trx.total}`,
                        )
                    },
                )

                doc.end()
            },
        )
    }

    async stockMovements(
        storeId: string,
    ) {
        return this.prisma.stockMovement.findMany({
            where: {
                storeId,
            },

            include: {
                product: true,
            },

            orderBy: {
                createdAt:
                    'desc',
            },
        })
    }

    async profit(
        storeId: string,
    ) {
        const sales =
            await this.prisma.transaction.aggregate({
                _sum: {
                    total: true,
                },

                where: {
                    storeId,
                    status:
                        TransactionStatus.PAID,
                },
            })

        const expenses =
            await this.prisma.expense.aggregate({
                _sum: {
                    amount: true,
                },

                where: {
                    storeId,
                },
            })

        const totalSales =
            sales._sum.total ?? 0

        const totalExpense =
            expenses._sum.amount ??
            0

        return {
            totalSales,
            totalExpense,

            estimatedProfit:
                totalSales -
                totalExpense,
        }
    }
}