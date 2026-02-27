CREATE TYPE "public"."upload_session_status" AS ENUM('uploaded', 'mapped', 'validated', 'imported');--> statement-breakpoint
CREATE TABLE "sales_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"sku_id" text NOT NULL,
	"pin_code" text NOT NULL,
	"units_sold" integer NOT NULL,
	"unit_price_paise" integer,
	"session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"s3_key" text,
	"original_filename" text NOT NULL,
	"row_count" integer DEFAULT 0,
	"detected_columns" text[],
	"column_mapping" text,
	"status" "upload_session_status" DEFAULT 'uploaded' NOT NULL,
	"is_synthetic" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "upload_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "sales_history" ADD CONSTRAINT "sales_history_sku_id_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."skus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_history" ADD CONSTRAINT "sales_history_pin_code_pin_codes_pin_code_fk" FOREIGN KEY ("pin_code") REFERENCES "public"."pin_codes"("pin_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_history_date_idx" ON "sales_history" USING btree ("date");--> statement-breakpoint
CREATE INDEX "sales_history_sku_idx" ON "sales_history" USING btree ("sku_id");--> statement-breakpoint
CREATE INDEX "sales_history_pin_idx" ON "sales_history" USING btree ("pin_code");--> statement-breakpoint
CREATE INDEX "sales_history_session_idx" ON "sales_history" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "upload_sessions_session_idx" ON "upload_sessions" USING btree ("session_id");