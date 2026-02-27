import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skus } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [sku] = await db.select().from(skus).where(eq(skus.id, id));

    if (!sku) {
      return NextResponse.json(
        { success: false, error: { code: "SKU_NOT_FOUND", message: "SKU not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sku,
    });
  } catch (error) {
    console.error("Error fetching SKU:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch SKU" } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if SKU exists
    const [existingSku] = await db.select().from(skus).where(eq(skus.id, id));
    if (!existingSku) {
      return NextResponse.json(
        { success: false, error: { code: "SKU_NOT_FOUND", message: "SKU not found" } },
        { status: 404 }
      );
    }

    // Validation
    const errors: Record<string, string> = {};
    if (body.name !== undefined && !body.name?.trim()) errors.name = "required";
    if (body.name && body.name.length > 100) errors.name = "must be under 100 characters";
    if (body.unit_cost_paise !== undefined && (!body.unit_cost_paise || body.unit_cost_paise < 100)) {
      errors.unit_cost_paise = "must be at least ₹1";
    }
    if (body.lead_time_days !== undefined && (!body.lead_time_days || body.lead_time_days < 1 || body.lead_time_days > 90)) {
      errors.lead_time_days = "must be 1-90 days";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", fields: errors } },
        { status: 422 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.unit_cost_paise !== undefined) updateData.unitCostPaise = body.unit_cost_paise;
    if (body.lead_time_days !== undefined) updateData.leadTimeDays = body.lead_time_days;
    if (body.status !== undefined) updateData.status = body.status;

    const [updatedSku] = await db
      .update(skus)
      .set(updateData)
      .where(eq(skus.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedSku,
    });
  } catch (error) {
    console.error("Error updating SKU:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update SKU" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if SKU exists
    const [existingSku] = await db.select().from(skus).where(eq(skus.id, id));
    if (!existingSku) {
      return NextResponse.json(
        { success: false, error: { code: "SKU_NOT_FOUND", message: "SKU not found" } },
        { status: 404 }
      );
    }

    // TODO: Check for forecast data before deletion
    // For now, we'll just delete the SKU
    await db.delete(skus).where(eq(skus.id, id));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting SKU:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete SKU" } },
      { status: 500 }
    );
  }
}
