-- CreateTable
CREATE TABLE `media_assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `public_id` VARCHAR(255) NOT NULL,
    `secure_url` TEXT NOT NULL,
    `resource_type` ENUM('IMAGE', 'VIDEO', 'RAW') NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `format` VARCHAR(50) NULL,
    `bytes` INTEGER NULL,
    `alt` VARCHAR(255) NULL,
    `caption` VARCHAR(500) NULL,
    `folder` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'READY', 'FAILED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `media_assets_public_id_key`(`public_id`),
    INDEX `media_assets_resource_type_status_idx`(`resource_type`, `status`),
    INDEX `media_assets_folder_idx`(`folder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `short_description` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `cover_media_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `services_slug_key`(`slug`),
    INDEX `services_active_sort_order_idx`(`active`, `sort_order`),
    INDEX `services_cover_media_id_idx`(`cover_media_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_id` INTEGER NOT NULL,
    `media_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `service_media_service_id_sort_order_idx`(`service_id`, `sort_order`),
    INDEX `service_media_media_id_idx`(`media_id`),
    UNIQUE INDEX `service_media_service_id_media_id_key`(`service_id`, `media_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_products` (
    `service_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `service_products_product_id_idx`(`product_id`),
    PRIMARY KEY (`service_id`, `product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `realization_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `realization_categories_slug_key`(`slug`),
    INDEX `realization_categories_active_sort_order_idx`(`active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `realizations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `service_id` INTEGER NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `project_date` DATETIME(3) NULL,
    `project_year` INTEGER NULL,
    `summary` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `technical_attributes` JSON NULL,
    `cover_media_id` INTEGER NULL,
    `video_media_id` INTEGER NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `realizations_slug_key`(`slug`),
    INDEX `realizations_category_id_status_idx`(`category_id`, `status`),
    INDEX `realizations_service_id_idx`(`service_id`),
    INDEX `realizations_featured_status_idx`(`featured`, `status`),
    INDEX `realizations_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `realization_media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `realization_id` INTEGER NOT NULL,
    `media_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `realization_media_realization_id_sort_order_idx`(`realization_id`, `sort_order`),
    INDEX `realization_media_media_id_idx`(`media_id`),
    UNIQUE INDEX `realization_media_realization_id_media_id_key`(`realization_id`, `media_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `realization_products` (
    `realization_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `realization_products_product_id_idx`(`product_id`),
    PRIMARY KEY (`realization_id`, `product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `media_id` INTEGER NOT NULL,
    `role` ENUM('MAIN', 'GALLERY', 'DATASHEET') NOT NULL DEFAULT 'GALLERY',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_media_product_id_role_sort_order_idx`(`product_id`, `role`, `sort_order`),
    INDEX `product_media_media_id_idx`(`media_id`),
    UNIQUE INDEX `product_media_product_id_media_id_role_key`(`product_id`, `media_id`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `home_slides` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_media_id` INTEGER NULL,
    `eyebrow` VARCHAR(120) NULL,
    `title` VARCHAR(191) NOT NULL,
    `text` VARCHAR(500) NULL,
    `cta_label` VARCHAR(120) NULL,
    `cta_url` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `home_slides_active_sort_order_idx`(`active`, `sort_order`),
    INDEX `home_slides_image_media_id_idx`(`image_media_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trust_cards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(120) NOT NULL,
    `text` VARCHAR(500) NULL,
    `icon_key` VARCHAR(80) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `trust_cards_active_sort_order_idx`(`active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `business_name` VARCHAR(191) NOT NULL DEFAULT 'Grossiste Ouaga International',
    `address` TEXT NULL,
    `city` VARCHAR(120) NULL,
    `phone` VARCHAR(32) NULL,
    `whatsapp` VARCHAR(32) NULL,
    `email` VARCHAR(191) NULL,
    `hours_text` TEXT NULL,
    `maps_url` TEXT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `facebook_url` TEXT NULL,
    `instagram_url` TEXT NULL,
    `linkedin_url` TEXT NULL,
    `youtube_url` TEXT NULL,
    `tiktok_url` TEXT NULL,
    `logo_media_id` INTEGER NULL,
    `favicon_media_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `company_settings_logo_media_id_idx`(`logo_media_id`),
    INDEX `company_settings_favicon_media_id_idx`(`favicon_media_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `about_content` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `hero_title` VARCHAR(191) NULL,
    `hero_text` TEXT NULL,
    `hero_video_media_id` INTEGER NULL,
    `hero_poster_media_id` INTEGER NULL,
    `intro_title` VARCHAR(191) NULL,
    `intro_text` TEXT NULL,
    `intro_media_id` INTEGER NULL,
    `implantation_title` VARCHAR(191) NULL,
    `implantation_text` TEXT NULL,
    `mission_title` VARCHAR(191) NULL,
    `mission_text` TEXT NULL,
    `mission_media_id` INTEGER NULL,
    `values_title` VARCHAR(191) NULL,
    `values` JSON NULL,
    `strengths_title` VARCHAR(191) NULL,
    `strengths` JSON NULL,
    `strengths_media_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `about_content_hero_video_media_id_idx`(`hero_video_media_id`),
    INDEX `about_content_hero_poster_media_id_idx`(`hero_poster_media_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `email` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('UNREAD', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'UNREAD',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `contact_messages_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_cover_media_id_fkey` FOREIGN KEY (`cover_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_media` ADD CONSTRAINT `service_media_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_media` ADD CONSTRAINT `service_media_media_id_fkey` FOREIGN KEY (`media_id`) REFERENCES `media_assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_products` ADD CONSTRAINT `service_products_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_products` ADD CONSTRAINT `service_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realizations` ADD CONSTRAINT `realizations_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `realization_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realizations` ADD CONSTRAINT `realizations_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realizations` ADD CONSTRAINT `realizations_cover_media_id_fkey` FOREIGN KEY (`cover_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realizations` ADD CONSTRAINT `realizations_video_media_id_fkey` FOREIGN KEY (`video_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realization_media` ADD CONSTRAINT `realization_media_realization_id_fkey` FOREIGN KEY (`realization_id`) REFERENCES `realizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realization_media` ADD CONSTRAINT `realization_media_media_id_fkey` FOREIGN KEY (`media_id`) REFERENCES `media_assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realization_products` ADD CONSTRAINT `realization_products_realization_id_fkey` FOREIGN KEY (`realization_id`) REFERENCES `realizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realization_products` ADD CONSTRAINT `realization_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_media` ADD CONSTRAINT `product_media_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_media` ADD CONSTRAINT `product_media_media_id_fkey` FOREIGN KEY (`media_id`) REFERENCES `media_assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `home_slides` ADD CONSTRAINT `home_slides_image_media_id_fkey` FOREIGN KEY (`image_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_settings` ADD CONSTRAINT `company_settings_logo_media_id_fkey` FOREIGN KEY (`logo_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_settings` ADD CONSTRAINT `company_settings_favicon_media_id_fkey` FOREIGN KEY (`favicon_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `about_content` ADD CONSTRAINT `about_content_hero_video_media_id_fkey` FOREIGN KEY (`hero_video_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `about_content` ADD CONSTRAINT `about_content_hero_poster_media_id_fkey` FOREIGN KEY (`hero_poster_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `about_content` ADD CONSTRAINT `about_content_intro_media_id_fkey` FOREIGN KEY (`intro_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `about_content` ADD CONSTRAINT `about_content_mission_media_id_fkey` FOREIGN KEY (`mission_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `about_content` ADD CONSTRAINT `about_content_strengths_media_id_fkey` FOREIGN KEY (`strengths_media_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
