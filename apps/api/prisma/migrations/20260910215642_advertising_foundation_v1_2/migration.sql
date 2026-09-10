-- CreateTable
CREATE TABLE `AdIntegration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `platform` ENUM('META', 'GOOGLE') NOT NULL,
    `status` ENUM('NOT_CONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR') NOT NULL DEFAULT 'NOT_CONNECTED',
    `externalAccountId` VARCHAR(191) NULL,
    `externalBusinessId` VARCHAR(191) NULL,
    `externalPageId` VARCHAR(191) NULL,
    `externalProfileId` VARCHAR(191) NULL,
    `tokenRef` VARCHAR(500) NULL,
    `secretsMetadata` JSON NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdIntegration_platform_key`(`platform`),
    INDEX `AdIntegration_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdCampaign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `platform` ENUM('META', 'GOOGLE') NOT NULL,
    `productId` INTEGER NOT NULL,
    `objective` ENUM('WHATSAPP', 'PRODUCT_VISITS', 'SALES_CONVERSIONS') NOT NULL,
    `budgetType` ENUM('DAILY', 'TOTAL') NOT NULL,
    `budgetAmount` INTEGER NOT NULL,
    `currency` VARCHAR(8) NOT NULL DEFAULT 'XOF',
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `audienceZone` VARCHAR(500) NOT NULL,
    `adText` TEXT NOT NULL,
    `creativeMediaId` INTEGER NOT NULL,
    `creativeSnapshot` JSON NOT NULL,
    `externalCampaignId` VARCHAR(191) NULL,
    `externalGroupId` VARCHAR(191) NULL,
    `externalAdId` VARCHAR(191) NULL,
    `externalStatus` VARCHAR(120) NULL,
    `status` ENUM('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'STOPPED', 'COMPLETED', 'REJECTED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    `lastSyncAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AdCampaign_platform_status_idx`(`platform`, `status`),
    INDEX `AdCampaign_productId_idx`(`productId`),
    INDEX `AdCampaign_startAt_idx`(`startAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdMetricSnapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `capturedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `spend` INTEGER NOT NULL DEFAULT 0,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `conversions` INTEGER NOT NULL DEFAULT 0,
    `rawMetrics` JSON NULL,

    INDEX `AdMetricSnapshot_campaignId_capturedAt_idx`(`campaignId`, `capturedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdCampaign` ADD CONSTRAINT `AdCampaign_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdMetricSnapshot` ADD CONSTRAINT `AdMetricSnapshot_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `AdCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
