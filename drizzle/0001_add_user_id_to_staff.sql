-- Migration: Add userId foreign key to staff table
-- This establishes OneToOne relationship: users <-> staff

-- Add user_id column to staff if it doesn't exist
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "user_id" integer NOT NULL UNIQUE;

-- Add foreign key constraint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
