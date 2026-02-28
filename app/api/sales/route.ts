import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salesHistory, skus, pinCodes } from "@/lib/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
    const offset = (page - 1) * limit;
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const skuId = searchParams.get("sku_id");
    const pinCode = searchParams.get("pin_code");
    const sortBy = searchParams.get("sort_by") || "date";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Build filters
    const filters = [];
    if (dateFrom) {
      filters.push(gte(salesHistory.date, new Date(dateFrom)));
    }
    if (dateTo) {
      filters.push(lte(salesHistory.date, new Date(dateTo)));
    }
    if (skuId && skuId !== "all") {
      filters.push(eq(salesHistory.skuId, skuId));
    }
    if (pinCode && pinCode !== "all") {
      filters.push(eq(salesHistory.pinCode, pinCode));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(salesHistory)
      .where(filters.length > 0 ? and(...filters) : undefined);
    
    const total = Number(countResult[0]?.count) || 0;

    // Get sales data with joins
    const orderColumn = sortBy === "sku_id" ? salesHistory.skuId 
      : sortBy === "pin_code" ? salesHistory.pinCode
      : sortBy === "units_sold" ? salesHistory.unitsSold
      : salesHistory.date;
    
    const orderDir = sortOrder === "asc" ? true : false;

    const sales = await db
      .select({
        id: salesHistory.id,
        date: salesHistory.date,
        skuId: salesHistory.skuId,
        skuName: skus.name,
        pinCode: salesHistory.pinCode,
        areaName: pinCodes.areaName,
        unitsSold: salesHistory.unitsSold,
        unitPricePaise: salesHistory.unitPricePaise,
        totalValue: sql<number>`${salesHistory.unitsSold} * COALESCE(${salesHistory.unitPricePaise}, 0)`,
        createdAt: salesHistory.createdAt,
      })
      .from(salesHistory)
      .leftJoin(skus, eq(salesHistory.skuId, skus.id))
      .leftJoin(pinCodes, eq(salesHistory.pinCode, pinCodes.pinCode))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(orderDir ? orderColumn : desc(orderColumn))
      .limit(limit)
      .offset(offset);

    // Get summary stats
    const summaryResult = await db
      .select({
        totalRecords: sql<number>`count(*)`,
        minDate: sql<string>`min(${salesHistory.date})::date`,
        maxDate: sql<string>`max(${salesHistory.date})::date`,
        uniqueSkus: sql<number>`count(distinct ${salesHistory.skuId})`,
        uniquePins: sql<number>`count(distinct ${salesHistory.pinCode})`,
        totalUnits: sql<number>`sum(${salesHistory.unitsSold})`,
      })
      .from(salesHistory);

    const summary = summaryResult[0] ? {
      total_records: Number(summaryResult[0].totalRecords) || 0,
      date_range: {
        min: summaryResult[0].minDate,
        max: summaryResult[0].maxDate,
      },
      unique_skus: Number(summaryResult[0].uniqueSkus) || 0,
      unique_pins: Number(summaryResult[0].uniquePins) || 0,
      total_units: Number(summaryResult[0].totalUnits) || 0,
    } : {
      total_records: 0,
      date_range: { min: null, max: null },
      unique_skus: 0,
      unique_pins: 0,
      total_units: 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        sales: sales.map((s) => ({
          id: s.id,
          date: s.date.toISOString().split("T")[0],
          sku_id: s.skuId,
          sku_name: s.skuName || "Unknown",
          pin_code: s.pinCode,
          area_name: s.areaName || "Unknown",
          units_sold: s.unitsSold,
          unit_price_paise: s.unitPricePaise,
          total_value: Number(s.totalValue),
        })),
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        summary,
      },
    });
  } catch (error) {
    console.error("Error fetching sales history:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch sales history" } },
      { status: 500 }
    );
  }
}
