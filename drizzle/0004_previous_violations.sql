DO $$ BEGIN
  ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_payroll_id_payrolls_id_fk";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "staff_schedules" ALTER COLUMN "start_time" SET DATA TYPE time USING start_time::time without time zone;--> statement-breakpoint
ALTER TABLE "staff_schedules" ALTER COLUMN "end_time" SET DATA TYPE time USING end_time::time without time zone;--> statement-breakpoint
ALTER TABLE "appointment_services" ADD COLUMN IF NOT EXISTS "payroll_id" integer;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_payroll_id_payrolls_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "payroll_id";