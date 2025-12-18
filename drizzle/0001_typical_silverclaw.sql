CREATE TABLE `staff_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staff_id` int NOT NULL,
	`day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`is_off` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `staff_schedules` ADD CONSTRAINT `staff_schedules_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE cascade ON UPDATE no action;