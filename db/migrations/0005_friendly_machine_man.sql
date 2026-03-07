CREATE TABLE "forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_data" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forecasts_generated_at_idx" ON "forecasts" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "forecasts_user_id_idx" ON "forecasts" USING btree ("user_id");