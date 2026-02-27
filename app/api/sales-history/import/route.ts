import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions, salesHistory, skus } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getFile } from "@/lib/storage";
import { parseDate } from "@/lib/date-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", fields: { session_id: "required" } } },
        { status: 422 }
      );
    }

    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.sessionId, session_id));

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    const mapping = session.columnMapping ? JSON.parse(session.columnMapping) : null;
    if (!mapping) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_MAPPED", message: "Column mapping not found" } },
        { status: 400 }
      );
    }

    const fileContent = await getFile(session_id, session.originalFilename);
    const csvText = fileContent.toString("utf-8");
    const lines = csvText.trim().split("\n");

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: { code: "EMPTY_FILE", message: "No data to import" } },
        { status: 400 }
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    
    const existingSkus = await db.select({ id: skus.id }).from(skus);
    const validSkuIds = new Set(existingSkus.map((s) => s.id));

    const salesData: typeof salesHistory.$inferInsert[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      const dateVal = row[mapping.date_col?.toLowerCase()];
      const skuVal = row[mapping.sku_id_col?.toLowerCase()];
      const pinVal = row[mapping.pin_code_col?.toLowerCase()];
      const unitsVal = row[mapping.units_sold_col?.toLowerCase()];
      const priceVal = mapping.unit_price_col ? row[mapping.unit_price_col?.toLowerCase()] : null;

      const date = parseDate(dateVal);
      const units = parseInt(unitsVal);
      const price = priceVal ? Math.round(parseFloat(priceVal) * 100) : null;

      if (!date) continue;
      if (!skuVal || !validSkuIds.has(skuVal)) {
        skippedCount++;
        continue;
      }
      if (!pinVal || !pinVal.match(/^\d{6}$/)) continue;
      if (isNaN(units) || units < 0) continue;

      salesData.push({
        date,
        skuId: skuVal,
        pinCode: pinVal,
        unitsSold: units,
        unitPricePaise: price,
        sessionId: session_id,
      });

      importedCount++;

      if (salesData.length >= 500) {
        await db.insert(salesHistory).values(salesData);
        salesData.length = 0;
      }
    }

    if (salesData.length > 0) {
      await db.insert(salesHistory).values(salesData);
    }

    await db
      .update(uploadSessions)
      .set({
        rowCount: importedCount,
        status: "imported",
      })
      .where(eq(uploadSessions.sessionId, session_id));

    return NextResponse.json({
      success: true,
      data: {
        session_id,
        imported_count: importedCount,
        skipped_count: skippedCount,
        message: `Successfully imported ${importedCount} sales records`,
      },
    });
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to import data" } },
      { status: 500 }
    );
  }
}
