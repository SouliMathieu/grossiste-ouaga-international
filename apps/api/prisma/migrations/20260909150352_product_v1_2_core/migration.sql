-- AlterTable
ALTER TABLE `products` ADD COLUMN `brand` VARCHAR(120) NULL,
    ADD COLUMN `price_on_request` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `promo_end_at` DATETIME(3) NULL,
    ADD COLUMN `promo_price` DECIMAL(12, 0) NULL,
    ADD COLUMN `promo_start_at` DATETIME(3) NULL;
