import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions, salesHistory, skus, pinCodes } from "@/lib/db/schema";
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

    // Fetch existing SKUs
    const existingSkus = await db.select({ id: skus.id }).from(skus);
    const validSkuIds = new Set(existingSkus.map((s) => s.id));

    // Fetch existing PINs and collect missing ones
    const existingPins = await db.select({ pinCode: pinCodes.pinCode }).from(pinCodes);
    const existingPinCodes = new Set(existingPins.map((p) => p.pinCode));

    // Scan CSV to find missing PINs
    const missingPinSet = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      const pinVal = row[mapping.pin_code_col?.toLowerCase()];
      if (pinVal && pinVal.match(/^\d{6}$/) && !existingPinCodes.has(pinVal)) {
        missingPinSet.add(pinVal);
      }
    }

    // Auto-create missing PIN codes
    const pinsToCreate = Array.from(missingPinSet);
    if (pinsToCreate.length > 0) {
      const pinValues = pinsToCreate.map((pin) => ({
        pinCode: pin,
        areaName: `Area ${pin}`,
        region: "Other",
        storeCount: 0,
        status: "active" as const,
      }));
      await db.insert(pinCodes).values(pinValues).onConflictDoNothing();
    }

    // Refresh PIN codes set after creation
    const updatedPins = await db.select({ pinCode: pinCodes.pinCode }).from(pinCodes);
    const validPinCodes = new Set(updatedPins.map((p) => p.pinCode));

    const salesData: typeof salesHistory.$inferInsert[] = [];
    let importedCount = 0;
    let skippedCount = 0;
    const skipReasons = {
      missing_skus: 0,
      missing_pins: 0,
      invalid_data: 0,
    };
    const skippedSkus = new Set<string>();
    const skippedPins = new Set<string>();

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

      // Check SKU existence
      if (!skuVal || !validSkuIds.has(skuVal)) {
        if (skuVal) skippedSkus.add(skuVal);
        skipReasons.missing_skus++;
        skippedCount++;
        continue;
      }

      // Check PIN existence
      if (!pinVal || !validPinCodes.has(pinVal)) {
        if (pinVal) skippedPins.add(pinVal);
        skipReasons.missing_pins++;
        skippedCount++;
        continue;
      }

      const date = parseDate(dateVal);
      const units = parseInt(unitsVal);
      const price = priceVal ? Math.round(parseFloat(priceVal) * 100) : null;

      if (!date || isNaN(units) || units < 0) {
        skipReasons.invalid_data++;
        skippedCount++;
        continue;
      }

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

    // Build detailed message
    let message = `Successfully imported ${importedCount.toLocaleString()} sales records.`;
    if (skippedCount > 0) {
      message += ` ${skippedCount.toLocaleString()} records were skipped.`;
    }
    if (pinsToCreate.length > 0) {
      message += ` ${pinsToCreate.length} new PIN codes were auto-created.`;
    }
    if (skippedSkus.size > 0) {
      message += ` ${skippedSkus.size} SKUs were not found in the database.`;
    }

    return NextResponse.json({
      success: true,
      data: {
        session_id,
        imported_count: importedCount,
        skipped_count: skippedCount,
        pins_auto_created: pinsToCreate.length,
        reasons: skipReasons,
        missing_skus_list: Array.from(skippedSkus),
        missing_pins_list: Array.from(skippedPins),
        message,
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
