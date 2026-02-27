CREATE TYPE "public"."pin_code_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "pin_codes" (
	"pin_code" text PRIMARY KEY NOT NULL,
	"area_name" text NOT NULL,
	"region" text NOT NULL,
	"store_count" integer DEFAULT 0 NOT NULL,
	"status" "pin_code_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pin_codes_region_idx" ON "pin_codes" USING btree ("region");