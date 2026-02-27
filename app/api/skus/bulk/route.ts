import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skus } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

interface BulkSKUInput {
  name: string;
  category: string;
  unit_cost?: number;
  unit_cost_paise?: number;
  lead_time_days: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skus: skuList } = body;

    if (!Array.isArray(skuList) || skuList.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No SKUs provided" } },
        { status: 422 }
      );
    }

    // Validate each SKU
    const validSkus: BulkSKUInput[] = [];
    const errors: string[] = [];

    for (let i = 0; i < skuList.length; i++) {
      const sku = skuList[i];
      if (!sku.name?.trim()) {
        errors.push(`Row ${i + 1}: Product name is required`);
        continue;
      }
      if (!sku.category) {
        errors.push(`Row ${i + 1}: Category is required`);
        continue;
      }
      const unitCost = sku.unit_cost_paise ?? sku.unit_cost;
      if (!unitCost || unitCost < 100) {
        errors.push(`Row ${i + 1}: Unit cost must be at least ₹1`);
        continue;
      }
      if (!sku.lead_time_days || sku.lead_time_days < 1 || sku.lead_time_days > 90) {
        errors.push(`Row ${i + 1}: Lead time must be 1-90 days`);
        continue;
      }

      validSkus.push({
        name: sku.name.trim(),
        category: sku.category,
        unit_cost_paise: unitCost,
        lead_time_days: sku.lead_time_days,
      });
    }

    if (errors.length > 0 && validSkus.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: errors.join("; ") } },
        { status: 422 }
      );
    }

    // Get existing SKU names for upsert logic
    const existingSkus = await db.select({ id: skus.id, name: skus.name }).from(skus).orderBy(asc(skus.name));
    const existingNames = new Set(existingSkus.map(s => s.name.toLowerCase()));

    // Get the next SKU number
    let nextNum = 1;
    if (existingSkus.length > 0) {
      const lastId = existingSkus[existingSkus.length - 1].id;
      const match = lastId.match(/SKU-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    // Process SKUs - skip duplicates by name, create new IDs for new ones
    let createdCount = 0;
    let skippedCount = 0;
    const newSkusToInsert: typeof skus.$inferInsert[] = [];

    for (const sku of validSkus) {
      if (existingNames.has(sku.name.toLowerCase())) {
        skippedCount++;
        continue;
      }

      const newId = `SKU-${String(nextNum).padStart(3, "0")}`;
      nextNum++;

      newSkusToInsert.push({
        id: newId,
        name: sku.name,
        category: sku.category as "beverages" | "snacks" | "dairy" | "personal_care" | "household" | "other",
        unitCostPaise: sku.unit_cost_paise!,
        leadTimeDays: sku.lead_time_days,
        status: "no_history",
      });

      existingNames.add(sku.name.toLowerCase());
    }

    // Bulk insert new SKUs
    if (newSkusToInsert.length > 0) {
      await db.insert(skus).values(newSkusToInsert).onConflictDoNothing();
      createdCount = newSkusToInsert.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        created_count: createdCount,
        skipped_count: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Error bulk importing SKUs:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to import SKUs" } },
      { status: 500 }
    );
  }
}
