CREATE TYPE "public"."doctorType" AS ENUM('GENERAL', 'SPECIALIST');--> statement-breakpoint
CREATE TYPE "public"."userType" AS ENUM('DOCTOR', 'NURSE', 'PATIENT');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"organization" varchar(255) NOT NULL,
	"subdivision" varchar(255),
	"district" varchar(255),
	"user_type" "userType" DEFAULT 'PATIENT',
	"doctor_type" "doctorType",
	"department" varchar(255),
	"specialization" varchar(255),
	"avatar" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
