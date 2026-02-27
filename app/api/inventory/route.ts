import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventory, skus } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const query = db
      .select({
        skuId: inventory.skuId,
        pinCode: inventory.pinCode,
        stockOnHand: inventory.stockOnHand,
        reorderPoint: inventory.reorderPoint,
        lastUpdated: inventory.lastUpdated,
        skuName: skus.name,
        category: skus.category,
      })
      .from(inventory)
      .innerJoin(skus, eq(inventory.skuId, skus.id))
      .orderBy(asc(skus.category), asc(skus.name), asc(inventory.pinCode));

    let results = await query;
    
    if (category && category !== "all") {
      results = results.filter(r => r.category === category);
    }

    const records = results.map((r) => ({
      sku_id: r.skuId,
      pin_code: r.pinCode,
      stock_on_hand: r.stockOnHand,
      reorder_point: r.reorderPoint,
      last_updated: r.lastUpdated.toISOString(),
      sku_name: r.skuName,
      category: r.category,
    }));

    return NextResponse.json({
      success: true,
      data: {
        records,
        total: records.length,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch inventory" } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No records provided" } },
        { status: 422 }
      );
    }

    let updatedCount = 0;

    for (const record of records) {
      const { sku_id, pin_code, stock_on_hand, reorder_point } = record;

      if (!sku_id || !pin_code) {
        continue;
      }

      // Upsert - update if exists, insert if not
      const existing = await db
        .select()
        .from(inventory)
        .where(and(eq(inventory.skuId, sku_id), eq(inventory.pinCode, pin_code)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(inventory)
          .set({
            stockOnHand: stock_on_hand ?? existing[0].stockOnHand,
            reorderPoint: reorder_point ?? existing[0].reorderPoint,
            lastUpdated: new Date(),
          })
          .where(and(eq(inventory.skuId, sku_id), eq(inventory.pinCode, pin_code)));
      } else {
        await db.insert(inventory).values({
          skuId: sku_id,
          pinCode: pin_code,
          stockOnHand: stock_on_hand ?? 0,
          reorderPoint: reorder_point ?? 0,
        });
      }
      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      data: { updated_count: updatedCount },
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update inventory" } },
      { status: 500 }
    );
  }
}
