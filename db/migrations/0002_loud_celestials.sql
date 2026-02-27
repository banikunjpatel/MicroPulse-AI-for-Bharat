CREATE TABLE "inventory" (
	"sku_id" text NOT NULL,
	"pin_code" text NOT NULL,
	"stock_on_hand" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_sku_id_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."skus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_sku_idx" ON "inventory" USING btree ("sku_id");--> statement-breakpoint
CREATE INDEX "inventory_pin_idx" ON "inventory" USING btree ("pin_code");