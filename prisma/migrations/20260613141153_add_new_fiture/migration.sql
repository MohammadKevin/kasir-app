-- AlterTable
ALTER TABLE `customers` ADD COLUMN `memberNumber` VARCHAR(191) NULL,
    ADD COLUMN `memberTier` VARCHAR(191) NOT NULL DEFAULT 'BRONZE';

-- AlterTable
ALTER TABLE `stores` ADD COLUMN `serviceRate` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `taxRate` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `orderType` VARCHAR(191) NOT NULL DEFAULT 'TAKEAWAY',
    ADD COLUMN `pointsEarned` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `pointsRedeemed` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `serviceAmount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `splitPayments` JSON NULL,
    ADD COLUMN `tableId` CHAR(36) NULL,
    ADD COLUMN `taxAmount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `paymentMethod` ENUM('CASH', 'QRIS', 'TRANSFER', 'DEBIT', 'CREDIT', 'SPLIT') NOT NULL;

-- CreateTable
CREATE TABLE `tables` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL DEFAULT 4,
    `status` VARCHAR(191) NOT NULL DEFAULT 'AVAILABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tables_storeId_idx`(`storeId`),
    UNIQUE INDEX `tables_storeId_number_key`(`storeId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingredients` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `stock` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ingredients_storeId_idx`(`storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_ingredients` (
    `id` CHAR(36) NOT NULL,
    `productId` CHAR(36) NOT NULL,
    `ingredientId` CHAR(36) NOT NULL,
    `quantity` DOUBLE NOT NULL,

    INDEX `product_ingredients_productId_idx`(`productId`),
    INDEX `product_ingredients_ingredientId_idx`(`ingredientId`),
    UNIQUE INDEX `product_ingredients_productId_ingredientId_key`(`productId`, `ingredientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `clockIn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clockOut` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendances_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `transactions_tableId_idx` ON `transactions`(`tableId`);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `tables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tables` ADD CONSTRAINT `tables_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingredients` ADD CONSTRAINT `ingredients_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_ingredients` ADD CONSTRAINT `product_ingredients_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_ingredients` ADD CONSTRAINT `product_ingredients_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
