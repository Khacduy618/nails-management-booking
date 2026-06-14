ALTER TABLE "customers" DROP CONSTRAINT "customers_phone_unique";--> statement-breakpoint
DROP INDEX "appointments_customer_phone_idx";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "customer_phone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "phone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "customer_phone_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "phone_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "email_hash" varchar(255);--> statement-breakpoint
CREATE INDEX "appointments_customer_phone_hash_idx" ON "appointments" USING btree ("customer_phone_hash");