import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions, salesHistory } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

function toSnakeCase(session: typeof uploadSessions.$inferSelect, dateRange?: { min_date: string; max_date: string; unique_skus: number; unique_pins: number }) {
  return {
    session_id: session.sessionId,
    s3_key: session.s3Key,
    original_filename: session.originalFilename,
    row_count: session.rowCount,
    detected_columns: session.detectedColumns,
    column_mapping: session.columnMapping ? JSON.parse(session.columnMapping) : null,
    status: session.status,
    is_synthetic: session.isSynthetic,
    error_message: session.errorMessage,
    created_at: session.createdAt.toISOString(),
    updated_at: session.updatedAt.toISOString(),
    ...(dateRange && {
      date_range: {
        min_date: dateRange.min_date,
        max_date: dateRange.max_date,
        unique_skus: dateRange.unique_skus,
        unique_pins: dateRange.unique_pins,
      }
    }),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.sessionId, id));

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    let dateRange;
    if (session.status === "imported") {
      const stats = await db
        .select({
          min_date: sql<string>`min(${salesHistory.date})::date`,
          max_date: sql<string>`max(${salesHistory.date})::date`,
          unique_skus: sql<number>`count(distinct ${salesHistory.skuId})`,
          unique_pins: sql<number>`count(distinct ${salesHistory.pinCode})`,
        })
        .from(salesHistory)
        .where(eq(salesHistory.sessionId, id));
      
      if (stats.length > 0 && stats[0].min_date) {
        dateRange = {
          min_date: stats[0].min_date,
          max_date: stats[0].max_date,
          unique_skus: Number(stats[0].unique_skus),
          unique_pins: Number(stats[0].unique_pins),
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: toSnakeCase(session, dateRange),
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch session" } },
      { status: 500 }
    );
  }
}
