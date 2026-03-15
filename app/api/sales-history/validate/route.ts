import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions, skus, pinCodes } from "@/lib/db/schema";
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

    if (!session.columnMapping) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_MAPPED", message: "Column mapping not found. Please map columns first." } },
        { status: 400 }
      );
    }

    const mapping = JSON.parse(session.columnMapping);
    const fileContent = await getFile(session_id, session.originalFilename);
    const csvText = fileContent.toString("utf-8");
    const lines = csvText.trim().split("\n");

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: { code: "EMPTY_FILE", message: "CSV file is empty or has no data rows" } },
        { status: 400 }
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredFields = ["date_col", "sku_id_col", "pin_code_col", "units_sold_col"];
    const missingFields = requiredFields.filter((f) => !mapping[f]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: "INCOMPLETE_MAPPING", fields: missingFields } },
        { status: 400 }
      );
    }

    // Collect all unique SKUs and PINs from CSV
    const csvSkus = new Set<string>();
    const csvPins = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      const skuVal = row[mapping.sku_id_col?.toLowerCase()];
      const pinVal = row[mapping.pin_code_col?.toLowerCase()];

      if (skuVal) csvSkus.add(skuVal);
      if (pinVal && pinVal.match(/^\d{6}$/)) csvPins.add(pinVal);
    }

    // Fetch existing SKUs and PINs from DB
    const existingSkus = await db.select({ id: skus.id, name: skus.name }).from(skus);
    const existingPins = await db.select({ pinCode: pinCodes.pinCode }).from(pinCodes);

    const existingSkuIds = new Set(existingSkus.map((s) => s.id));
    const existingPinCodes = new Set(existingPins.map((p) => p.pinCode));

    // Find missing SKUs and PINs
    const missingSkuIds = Array.from(csvSkus).filter((sku) => !existingSkuIds.has(sku));
    const missingPins = Array.from(csvPins).filter((pin) => !existingPinCodes.has(pin));
    const validSkus = Array.from(csvSkus).filter((sku) => existingSkuIds.has(sku));
    const validPins = Array.from(csvPins).filter((pin) => existingPinCodes.has(pin));

    // Build new SKU proposals for missing SKUs (user will approve these)
    const newSkuProposals = missingSkuIds.map((skuId) => ({
      sku_id: skuId,
      name: skuId, // default name = the ID from CSV; user can see it
      category: "other" as const,
      unit_cost_paise: 100,
      lead_time_days: 7,
    }));

    // Validate data rows (treat missing SKUs as if they exist — they may be approved)
    const errors: { row: number; column: string; value: string; issue: string }[] = [];
    let validRows = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      const dateVal = row[mapping.date_col?.toLowerCase()];
      const skuVal = row[mapping.sku_id_col?.toLowerCase()];
      const pinVal = row[mapping.pin_code_col?.toLowerCase()];
      const unitsVal = row[mapping.units_sold_col?.toLowerCase()];

      const parsedDate = parseDate(dateVal);
      if (!parsedDate) {
        errors.push({ row: i, column: "date", value: dateVal || "", issue: "Invalid date format" });
        continue;
      }

      if (!skuVal || skuVal.length === 0) {
        errors.push({ row: i, column: "sku_id", value: skuVal || "", issue: "Missing SKU ID" });
        continue;
      }

      if (!pinVal || !pinVal.match(/^\d{6}$/)) {
        errors.push({ row: i, column: "pin_code", value: pinVal || "", issue: "Invalid PIN code" });
        continue;
      }

      const units = parseInt(unitsVal);
      if (isNaN(units) || units < 0) {
        errors.push({ row: i, column: "units_sold", value: unitsVal || "", issue: "Invalid units sold" });
        continue;
      }

      validRows++;
    }

    const invalidRows = lines.length - 1 - validRows;
    const totalRows = lines.length - 1;
    const hasMissingSkus = missingSkuIds.length > 0;
    const hasMissingPins = missingPins.length > 0;
    // Can proceed if data errors are acceptable (missing SKUs handled via approval flow)
    const canProceed = invalidRows === 0 || invalidRows / totalRows < 0.01;

    await db
      .update(uploadSessions)
      .set({
        rowCount: totalRows,
        status: "validated",
      })
      .where(eq(uploadSessions.sessionId, session_id));

    return NextResponse.json({
      success: true,
      data: {
        session_id,
        total_rows: totalRows,
        valid_rows: validRows,
        invalid_rows: invalidRows,
        errors: errors.slice(0, 10),
        can_proceed: canProceed,
        validation_summary: {
          missing_skus: missingSkuIds,
          new_sku_proposals: newSkuProposals,
          missing_pins: missingPins,
          valid_skus: validSkus,
          valid_pins: validPins,
          has_missing_skus: hasMissingSkus,
          has_missing_pins: hasMissingPins,
        },
      },
    });
  } catch (error) {
    console.error("Error validating data:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to validate data" } },
      { status: 500 }
    );
  }
}
