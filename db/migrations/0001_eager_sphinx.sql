CREATE TYPE "public"."sku_category" AS ENUM('beverages', 'snacks', 'dairy', 'personal_care', 'household', 'other');--> statement-breakpoint
CREATE TYPE "public"."sku_status" AS ENUM('active', 'inactive', 'no_history');--> statement-breakpoint
CREATE TABLE "skus" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "sku_category" NOT NULL,
	"unit_cost_paise" integer NOT NULL,
	"lead_time_days" integer NOT NULL,
	"status" "sku_status" DEFAULT 'no_history' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "skus_category_idx" ON "skus" USING btree ("category");