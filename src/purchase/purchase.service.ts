import {
    Injectable,
    NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { CreatePurchaseDto } from './dto/create-purchase.dto'

@Injectable()
export class PurchaseService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(
        dto: CreatePurchaseDto,
    ) {
        const supplier =
            await this.prisma.supplier.findUnique({
                where: {
                    id: dto.supplierId,
                },
            })

        if (!supplier) {
            throw new NotFoundException(
                'Supplier tidak ditemukan',
            )
        }

        let total = 0

        const itemsData: {
            productId: string
            quantity: number
            costPrice: number
            subtotal: number
        }[] = []

        for (const item of dto.items) {
            const product =
                await this.prisma.product.findUnique({
                    where: {
                        id: item.productId,
                    },
                })

            if (!product) {
                throw new NotFoundException(
                    `Produk ${item.productId} tidak ditemukan`,
                )
            }

            const subtotal =
                item.quantity *
                item.costPrice

            total += subtotal

            itemsData.push({
                productId:
                    item.productId,

                quantity:
                    item.quantity,

                costPrice:
                    item.costPrice,

                subtotal,
            })
        }

        const purchase =
            await this.prisma.purchase.create({
                data: {
                    storeId:
                        dto.storeId,

                    supplierId:
                        dto.supplierId,

                    invoiceNumber:
                        dto.invoiceNumber,

                    note:
                        dto.note,

                    total,

                    items: {
                        create:
                            itemsData,
                    },
                },

                include: {
                    supplier:
                        true,

                    items:
                        true,
                },
            })

        for (const item of dto.items) {
            await this.prisma.product.update({
                where: {
                    id:
                        item.productId,
                },

                data: {
                    stock: {
                        increment:
                            item.quantity,
                    },

                    costPrice:
                        item.costPrice,
                },
            })

            await this.prisma.stockMovement.create({
                data: {
                    storeId:
                        dto.storeId,

                    productId:
                        item.productId,

                    qty:
                        item.quantity,

                    type:
                        'IN',

                    note:
                        `Purchase ${dto.invoiceNumber}`,
                },
            })
        }

        return purchase
    }

    async findAll(
        storeId: string,
    ) {
        return this.prisma.purchase.findMany({
            where: {
                storeId,
            },

            include: {
                supplier:
                    true,

                items: {
                    include: {
                        product:
                            true,
                    },
                },
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
        const purchase =
            await this.prisma.purchase.findUnique({
                where: {
                    id,
                },

                include: {
                    supplier:
                        true,

                    items: {
                        include: {
                            product:
                                true,
                        },
                    },
                },
            })

        if (!purchase) {
            throw new NotFoundException(
                'Purchase tidak ditemukan',
            )
        }

        return purchase
    }

    async remove(
        id: string,
    ) {
        const purchase =
            await this.findOne(id)

        for (const item of purchase.items) {
            await this.prisma.product.update({
                where: {
                    id:
                        item.productId,
                },

                data: {
                    stock: {
                        decrement:
                            item.quantity,
                    },
                },
            })

            await this.prisma.stockMovement.create({
                data: {
                    storeId:
                        purchase.storeId,

                    productId:
                        item.productId,

                    qty:
                        item.quantity,

                    type:
                        'OUT',

                    note:
                        `Delete Purchase ${purchase.invoiceNumber}`,
                },
            })
        }

        await this.prisma.purchase.delete({
            where: {
                id,
            },
        })

        return {
            message:
                'Purchase berhasil dihapus',
        }
    }
}