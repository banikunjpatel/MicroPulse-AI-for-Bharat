import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salesHistory, uploadSessions } from "@/lib/db/schema";
import { sql, eq, and, gte, count } from "drizzle-orm";

export async function GET() {
  try {
    const salesCountResult = await db
      .select({ count: sql<number>`count(distinct ${salesHistory.date}::date)` })
      .from(salesHistory);
    
    const daysOfData = salesCountResult[0]?.count || 0;

    const latestSession = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.status, "imported"))
      .orderBy(sql`${uploadSessions.createdAt} desc`)
      .limit(1);

    const totalRows = latestSession.length > 0 ? latestSession[0].rowCount : 0;

    return NextResponse.json({
      success: true,
      data: {
        sales_history: {
          ok: daysOfData >= 30,
          days_of_data: daysOfData,
          total_rows: totalRows,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching sales history readiness:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch readiness" } },
      { status: 500 }
    );
  }
}
