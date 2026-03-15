import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions, salesHistory, skus, pinCodes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getFile } from "@/lib/storage";
import { parseDate } from "@/lib/date-utils";

interface ApprovedSku {
  sku_id: string;
  name: string;
  category: "beverages" | "snacks" | "dairy" | "personal_care" | "household" | "other";
  unit_cost_paise: number;
  lead_time_days: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, approved_skus } = body as { session_id: string; approved_skus?: ApprovedSku[] };

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

    // Maps CSV SKU ID → DB SKU ID (may differ if CSV ID was already taken)
    const csvSkuIdToDbId = new Map<string, string>();

    // Create approved new SKUs before importing
    if (approved_skus && approved_skus.length > 0) {
      const existingForCheck = await db.select({ id: skus.id }).from(skus).orderBy(desc(skus.id));
      let nextNum = 1;
      if (existingForCheck.length > 0) {
        const match = existingForCheck[0].id.match(/SKU-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      const existingIds = new Set(existingForCheck.map((s) => s.id));

      const skusToCreate: typeof skus.$inferInsert[] = [];
      for (const approvedSku of approved_skus) {
        // Use the CSV sku_id if it's a valid SKU-XXX format and not taken, else generate
        let newId = approvedSku.sku_id;
        if (existingIds.has(newId) || !newId.match(/^SKU-\d+$/)) {
          newId = `SKU-${String(nextNum).padStart(3, "0")}`;
          nextNum++;
        }
        csvSkuIdToDbId.set(approvedSku.sku_id, newId);
        skusToCreate.push({
          id: newId,
          name: approvedSku.name,
          category: approvedSku.category,
          unitCostPaise: approvedSku.unit_cost_paise,
          leadTimeDays: approvedSku.lead_time_days,
          status: "no_history",
        });
        existingIds.add(newId);
      }

      if (skusToCreate.length > 0) {
        await db.insert(skus).values(skusToCreate).onConflictDoNothing();
      }
    }

    // Fetch existing SKUs (now includes any newly created ones)
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

      // Check SKU existence — resolve CSV ID to DB ID if it was remapped
      const resolvedSkuId = csvSkuIdToDbId.get(skuVal) ?? skuVal;
      if (!resolvedSkuId || !validSkuIds.has(resolvedSkuId)) {
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
      const units = Math.round(parseFloat(unitsVal)); // support decimal quantities (e.g. 8.78 kg → 9)
      const price = priceVal ? Math.round(parseFloat(priceVal) * 100) : null;

      if (!date || isNaN(units) || units < 0) {
        skipReasons.invalid_data++;
        skippedCount++;
        continue;
      }

      salesData.push({
        date,
        skuId: resolvedSkuId,
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

    let message = `Successfully imported ${importedCount.toLocaleString()} sales records.`;
    if (approved_skus && approved_skus.length > 0) {
      message += ` ${approved_skus.length} new SKU(s) were created.`;
    }
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
        skus_created: approved_skus?.length ?? 0,
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
