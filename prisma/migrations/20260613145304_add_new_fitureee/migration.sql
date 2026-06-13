-- AlterTable
ALTER TABLE `stores` ADD COLUMN `receiptFooter` TEXT NULL,
    ADD COLUMN `receiptHeader` TEXT NULL,
    ADD COLUMN `receiptShowBarcode` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `receiptShowCustomer` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `receiptSize` VARCHAR(191) NOT NULL DEFAULT '58mm';
