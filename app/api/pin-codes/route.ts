import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pinCodes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

function toSnakeCase(pinCode: typeof pinCodes.$inferSelect) {
  return {
    pin_code: pinCode.pinCode,
    area_name: pinCode.areaName,
    region: pinCode.region,
    store_count: pinCode.storeCount,
    status: pinCode.status,
  };
}

export async function GET() {
  try {
    const allPinCodes = await db.select().from(pinCodes).orderBy(desc(pinCodes.pinCode));

    return NextResponse.json({
      success: true,
      data: {
        pin_codes: allPinCodes.map(toSnakeCase),
        total: allPinCodes.length,
      },
    });
  } catch (error) {
    console.error("Error fetching PIN codes:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch PIN codes" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin_code, area_name, region, store_count, status } = body;

    const errors: Record<string, string> = {};
    if (!pin_code?.trim()) errors.pin_code = "required";
    if (!area_name?.trim()) errors.area_name = "required";
    if (!region?.trim()) errors.region = "required";
    if (store_count !== undefined && (typeof store_count !== "number" || store_count < 0)) {
      errors.store_count = "must be a non-negative number";
    }
    if (status && !["active", "inactive"].includes(status)) {
      errors.status = "must be 'active' or 'inactive'";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", fields: errors } },
        { status: 422 }
      );
    }

    const [newPinCode] = await db
      .insert(pinCodes)
      .values({
        pinCode: pin_code.trim(),
        areaName: area_name.trim(),
        region: region.trim(),
        storeCount: store_count ?? 0,
        status: status ?? "active",
      })
      .returning();

    return NextResponse.json(
      { success: true, data: toSnakeCase(newPinCode) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating PIN code:", error);
    if (error instanceof Error && error.message.includes("duplicate")) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_ERROR", message: "PIN code already exists" } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create PIN code" } },
      { status: 500 }
    );
  }
}
