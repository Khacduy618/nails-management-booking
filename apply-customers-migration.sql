-- Create customers table
CREATE TABLE IF NOT EXISTS `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`service_count` int NOT NULL DEFAULT 0,
	`total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`last_appointment_date` date,
	`notes` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_phone_unique` UNIQUE(`phone`)
);

-- Add customer_id column to appointments if it doesn't exist
ALTER TABLE `appointments` ADD COLUMN IF NOT EXISTS `customer_id` int;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade;
