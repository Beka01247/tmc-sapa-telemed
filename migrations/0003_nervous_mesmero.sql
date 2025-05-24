CREATE TYPE "public"."measurementType" AS ENUM('blood-pressure', 'pulse', 'temperature', 'glucose', 'oximeter', 'spirometer', 'cholesterol', 'hemoglobin', 'triglycerides', 'weight', 'height', 'ultrasound', 'xray', 'inr');--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "measurementType" NOT NULL,
	"value1" varchar(255) NOT NULL,
	"value2" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;