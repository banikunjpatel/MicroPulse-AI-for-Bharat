import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions, skus, pinCodes, salesHistory } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    const allSkus = await db.select().from(skus);
    const allPins = await db.select().from(pinCodes).where(eq(pinCodes.status, "active"));

    if (allSkus.length === 0 || allPins.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_DATA",
            message: "Need at least 1 SKU and 1 PIN code to generate synthetic data. Please set up SKUs and PIN codes first.",
          },
        },
        { status: 400 }
      );
    }

    const sessionId = `synthetic-${randomUUID()}`;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180);
    const days = 180;

    const [session] = await db
      .insert(uploadSessions)
      .values({
        sessionId,
        s3Key: null,
        originalFilename: "synthetic_data.csv",
        rowCount: 0,
        detectedColumns: ["date", "sku_id", "pin_code", "units_sold", "unit_price"],
        columnMapping: JSON.stringify({
          date_col: "date",
          sku_id_col: "sku_id",
          pin_code_col: "pin_code",
          units_sold_col: "units_sold",
          unit_price_col: "unit_price",
        }),
        status: "imported",
        isSynthetic: true,
      })
      .returning();

    const salesData: typeof salesHistory.$inferInsert[] = [];
    let rowCount = 0;

    for (let d = 0; d < days; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + d);
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFriday = dayOfWeek === 5;

      for (const sku of allSkus) {
        for (const pin of allPins) {
          let baseUnits = Math.floor(Math.random() * 50) + 10;
          
          if (isWeekend) {
            baseUnits = Math.floor(baseUnits * 1.5);
          }
          if (isFriday) {
            baseUnits = Math.floor(baseUnits * 1.3);
          }

          const unitsSold = baseUnits + Math.floor(Math.random() * 20);
          const unitPrice = sku.unitCostPaise;

          salesData.push({
            date: currentDate,
            skuId: sku.id,
            pinCode: pin.pinCode,
            unitsSold,
            unitPricePaise: unitPrice,
            sessionId,
          });

          rowCount++;

          if (salesData.length >= 100) {
            await db.insert(salesHistory).values(salesData);
            salesData.length = 0;
          }
        }
      }
    }

    if (salesData.length > 0) {
      await db.insert(salesHistory).values(salesData);
    }

    await db
      .update(uploadSessions)
      .set({
        rowCount,
        status: "imported",
      })
      .where(eq(uploadSessions.sessionId, sessionId));

    return NextResponse.json(
      {
        success: true,
        data: {
          session_id: sessionId,
          row_count: rowCount,
          days,
          skus: allSkus.length,
          pin_codes: allPins.length,
          message: `Synthetic data generated for ${allSkus.length} SKUs × ${allPins.length} PINs × ${days} days`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating synthetic data:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to generate synthetic data" } },
      { status: 500 }
    );
  }
}
