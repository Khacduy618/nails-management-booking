CREATE INDEX "appointment_services_staff_id_idx" ON "appointment_services" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "appointment_services_appointment_id_idx" ON "appointment_services" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "appointments_appointment_date_idx" ON "appointments" USING btree ("appointment_date");--> statement-breakpoint
CREATE INDEX "appointments_customer_phone_idx" ON "appointments" USING btree ("customer_phone");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "service_count";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "total_amount";