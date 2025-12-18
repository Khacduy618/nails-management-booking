CREATE TABLE `appointment_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointment_id` int NOT NULL,
	`service_id` int NOT NULL,
	`staff_id` int,
	`price_at_booking` decimal(10,2) NOT NULL,
	`commission_percentage` decimal(5,2),
	`work_share` decimal(5,2) DEFAULT '100.00',
	CONSTRAINT `appointment_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_name` varchar(255) NOT NULL,
	`customer_phone` varchar(20) NOT NULL,
	`notes` text,
	`appointment_date` date NOT NULL,
	`appointment_time` time NOT NULL,
	`status` enum('pending','confirmed','completed','cancelled','in-progress') NOT NULL DEFAULT 'pending',
	`price_at_booking` decimal(10,2) NOT NULL,
	`duration_at_booking` int NOT NULL,
	`is_overtime` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`payroll_id` int,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payrolls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staff_id` int NOT NULL,
	`pay_period_start` date NOT NULL,
	`pay_period_end` date NOT NULL,
	`base_salary` decimal(10,2) DEFAULT '0.00',
	`total_commission` decimal(10,2) DEFAULT '0.00',
	`total_bonus` decimal(10,2) DEFAULT '0.00',
	`total_deduction` decimal(10,2) DEFAULT '0.00',
	`final_salary` decimal(10,2) NOT NULL,
	`status` enum('pending','calculated','paid','cancelled') NOT NULL DEFAULT 'pending',
	`payment_date` date,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `payrolls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	CONSTRAINT `service_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`duration` int NOT NULL,
	`image_url` varchar(255),
	`popular` boolean DEFAULT false,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`category_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(20),
	`position` varchar(100),
	`specialties` json,
	`experience` varchar(50),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`avatar_url` varchar(255),
	`join_date` date,
	`rating` decimal(3,2) DEFAULT '0.00',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `staff_services` (
	`staff_id` int NOT NULL,
	`service_id` int NOT NULL,
	CONSTRAINT `staff_services_staff_id_service_id_pk` PRIMARY KEY(`staff_id`,`service_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(20) NOT NULL,
	`password` varchar(255),
	`role` enum('customer','staff','admin') NOT NULL DEFAULT 'customer',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_payroll_id_payrolls_id_fk` FOREIGN KEY (`payroll_id`) REFERENCES `payrolls`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_category_id_service_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_services` ADD CONSTRAINT `staff_services_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_services` ADD CONSTRAINT `staff_services_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE cascade ON UPDATE no action;