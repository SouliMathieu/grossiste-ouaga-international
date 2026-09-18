-- AlterTable
ALTER TABLE `media_assets` ADD COLUMN `category_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `media_assets_folder_category_id_status_idx` ON `media_assets`(`folder`, `category_id`, `status`);

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
