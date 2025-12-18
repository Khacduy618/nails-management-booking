ALTER TABLE `service_categories` MODIFY COLUMN `status` enum('active','deleted','inactive') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `staff_schedules` MODIFY COLUMN `day_of_week` int NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_schedules` MODIFY COLUMN `start_time` varchar(5) NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_schedules` MODIFY COLUMN `end_time` varchar(5) NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_schedules` DROP COLUMN `is_off`;