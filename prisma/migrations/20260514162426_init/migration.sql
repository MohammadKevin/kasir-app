-- CreateTable
CREATE TABLE `Outlet` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `noTelp` VARCHAR(191) NULL,
    `qrisImage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    `resetToken` VARCHAR(191) NULL,
    `resetTokenExp` DATETIME(3) NULL,
    `outletId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `minStock` INTEGER NOT NULL DEFAULT 5,
    `costPrice` DOUBLE NOT NULL,
    `sellingPrice` DOUBLE NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `outletId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_sku_key`(`sku`),
    UNIQUE INDEX `Product_barcode_key`(`barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sale` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `totalProfit` DOUBLE NOT NULL,
    `paymentMethod` ENUM('CASH', 'QRIS', 'DEBIT', 'TRANSFER', 'E_WALLET') NOT NULL,
    `paymentStatus` ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paidAmount` DOUBLE NULL,
    `changeAmount` DOUBLE NULL,
    `paymentProof` VARCHAR(191) NULL,
    `outletId` VARCHAR(191) NOT NULL,
    `cashierId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Sale_invoiceNumber_key`(`invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaleItem` (
    `id` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `costPrice` DOUBLE NOT NULL,
    `sellingPrice` DOUBLE NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `profit` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('OPERATIONAL', 'STOCK', 'OTHER') NOT NULL DEFAULT 'OPERATIONAL',
    `amount` DOUBLE NOT NULL,
    `outletId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_outletId_fkey` FOREIGN KEY (`outletId`) REFERENCES `Outlet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_outletId_fkey` FOREIGN KEY (`outletId`) REFERENCES `Outlet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_outletId_fkey` FOREIGN KEY (`outletId`) REFERENCES `Outlet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_cashierId_fkey` FOREIGN KEY (`cashierId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_outletId_fkey` FOREIGN KEY (`outletId`) REFERENCES `Outlet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
