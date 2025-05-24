ALTER TABLE "users" ADD COLUMN "iin" varchar(12);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telephone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_iin_unique" UNIQUE("iin");