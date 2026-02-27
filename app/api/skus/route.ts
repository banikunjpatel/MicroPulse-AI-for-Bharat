import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skus } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allSkus = await db.select().from(skus).orderBy(desc(skus.createdAt));
    
    return NextResponse.json({
      success: true,
      data: {
        skus: allSkus,
        total: allSkus.length,
      },
    });
  } catch (error) {
    console.error("Error fetching SKUs:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch SKUs" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, unit_cost_paise, lead_time_days } = body;

    // Validation
    const errors: Record<string, string> = {};
    if (!name?.trim()) errors.name = "required";
    if (!category) errors.category = "required";
    if (!unit_cost_paise || unit_cost_paise < 100) errors.unit_cost_paise = "must be at least ₹1";
    if (!lead_time_days || lead_time_days < 1 || lead_time_days > 90) errors.lead_time_days = "must be 1-90 days";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", fields: errors } },
        { status: 422 }
      );
    }

    // Get the next SKU ID
    const existingSkus = await db.select({ id: skus.id }).from(skus).orderBy(desc(skus.id)).limit(1);
    let nextNum = 1;
    if (existingSkus.length > 0) {
      const lastId = existingSkus[0].id;
      const match = lastId.match(/SKU-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const newId = `SKU-${String(nextNum).padStart(3, "0")}`;

    // Insert the new SKU
    const [newSku] = await db
      .insert(skus)
      .values({
        id: newId,
        name: name.trim(),
        category,
        unitCostPaise: unit_cost_paise,
        leadTimeDays: lead_time_days,
        status: "no_history",
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newSku },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating SKU:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create SKU" } },
      { status: 500 }
    );
  }
}
