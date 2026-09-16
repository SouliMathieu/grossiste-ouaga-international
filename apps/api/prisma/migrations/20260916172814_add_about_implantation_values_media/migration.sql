-- AlterTable
ALTER TABLE `about_content` ADD COLUMN `implantation_media_id` INTEGER NULL,
    ADD COLUMN `values_media_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `about_content_implantation_media_id_idx` ON `about_content`(`implantation_media_id`);

-- CreateIndex
CREATE INDEX `about_content_values_media_id_idx` ON `about_content`(`values_media_id`);

-- AddForeignKey
ALTER TABLE `about_content` ADD CONSTRAINT `about_content_implantation_media_id_fkey` FOREIGN KEY (`implantation_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `about_content` ADD CONSTRAINT `about_content_values_media_id_fkey` FOREIGN KEY (`values_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
