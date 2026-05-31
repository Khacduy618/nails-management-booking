ALTER TABLE "appointments" DROP CONSTRAINT "appointments_payroll_id_payrolls_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_schedules" ALTER COLUMN "start_time" SET DATA TYPE time USING start_time::time without time zone;--> statement-breakpoint
ALTER TABLE "staff_schedules" ALTER COLUMN "end_time" SET DATA TYPE time USING end_time::time without time zone;--> statement-breakpoint
ALTER TABLE "appointment_services" ADD COLUMN "payroll_id" integer;--> statement-breakpoint
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_payroll_id_payrolls_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "payroll_id";