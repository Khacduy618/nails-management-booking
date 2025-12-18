-- Cập nhật bảng service_categories thêm status và deletedAt cho soft delete
ALTER TABLE `service_categories` ADD COLUMN `status` ENUM('active', 'inactive', 'deleted') NOT NULL DEFAULT 'active' AFTER `description`;
ALTER TABLE `service_categories` ADD COLUMN `deleted_at` TIMESTAMP NULL AFTER `status`;
