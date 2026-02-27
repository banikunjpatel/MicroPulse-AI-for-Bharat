import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pinCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function toSnakeCase(pinCode: typeof pinCodes.$inferSelect) {
  return {
    pin_code: pinCode.pinCode,
    area_name: pinCode.areaName,
    region: pinCode.region,
    store_count: pinCode.storeCount,
    status: pinCode.status,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  try {
    const { pin } = await params;
    const [pinCode] = await db.select().from(pinCodes).where(eq(pinCodes.pinCode, pin));

    if (!pinCode) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "PIN code not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: toSnakeCase(pinCode),
    });
  } catch (error) {
    console.error("Error fetching PIN code:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch PIN code" } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  try {
    const { pin } = await params;
    const body = await request.json();
    const { area_name, region, store_count, status } = body;

    const [existing] = await db.select().from(pinCodes).where(eq(pinCodes.pinCode, pin));
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "PIN code not found" } },
        { status: 404 }
      );
    }

    const errors: Record<string, string> = {};
    if (area_name !== undefined && !area_name?.trim()) errors.area_name = "cannot be empty";
    if (region !== undefined && !region?.trim()) errors.region = "cannot be empty";
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

    const [updated] = await db
      .update(pinCodes)
      .set({
        ...(area_name !== undefined && { areaName: area_name.trim() }),
        ...(region !== undefined && { region: region.trim() }),
        ...(store_count !== undefined && { storeCount: store_count }),
        ...(status !== undefined && { status }),
      })
      .where(eq(pinCodes.pinCode, pin))
      .returning();

    return NextResponse.json({
      success: true,
      data: toSnakeCase(updated),
    });
  } catch (error) {
    console.error("Error updating PIN code:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update PIN code" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  try {
    const { pin } = await params;
    const [deleted] = await db
      .delete(pinCodes)
      .where(eq(pinCodes.pinCode, pin))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "PIN code not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "PIN code deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting PIN code:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete PIN code" } },
      { status: 500 }
    );
  }
}
