import { db } from '@/lib/db';
import { salesHistory, inventory, skus, pinCodes } from '@/lib/db/schema';
import { desc, eq, sql, and, gte, lte } from 'drizzle-orm';

export interface SalesData {
  sku_id: string;
  sku_name: string;
  category: string;
  pin_code: string;
  area_name: string;
  region: string;
  date: Date;
  units_sold: number;
  unit_price_paise: number | null;
}

export interface InventoryData {
  sku_id: string;
  sku_name: string;
  category: string;
  pin_code: string;
  stock_on_hand: number;
  reorder_point: number;
}

export interface AggregatedSales {
  sku_id: string;
  sku_name: string;
  category: string;
  pin_code: string;
  area_name: string;
  region: string;
  total_units_sold: number;
  avg_daily_sales: number;
  days_active: number;
  last_sale_date: Date;
}

export async function getSalesHistoryData(
  daysBack: number = 90
): Promise<SalesData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const results = await db
    .select({
      sku_id: salesHistory.skuId,
      sku_name: skus.name,
      category: skus.category,
      pin_code: salesHistory.pinCode,
      area_name: pinCodes.areaName,
      region: pinCodes.region,
      date: salesHistory.date,
      units_sold: salesHistory.unitsSold,
      unit_price_paise: salesHistory.unitPricePaise,
    })
    .from(salesHistory)
    .innerJoin(skus, eq(salesHistory.skuId, skus.id))
    .innerJoin(pinCodes, eq(salesHistory.pinCode, pinCodes.pinCode))
    .where(gte(salesHistory.date, startDate))
    .orderBy(desc(salesHistory.date));

  return results;
}

export async function getInventoryData(): Promise<InventoryData[]> {
  const results = await db
    .select({
      sku_id: inventory.skuId,
      sku_name: skus.name,
      category: skus.category,
      pin_code: inventory.pinCode,
      stock_on_hand: inventory.stockOnHand,
      reorder_point: inventory.reorderPoint,
    })
    .from(inventory)
    .innerJoin(skus, eq(inventory.skuId, skus.id));

  return results;
}

export async function getAggregatedSalesBySKU(): Promise<AggregatedSales[]> {
  const results = await db
    .select({
      sku_id: salesHistory.skuId,
      sku_name: skus.name,
      category: skus.category,
      pin_code: salesHistory.pinCode,
      area_name: pinCodes.areaName,
      region: pinCodes.region,
      total_units_sold: sql<number>`sum(${salesHistory.unitsSold})`,
      avg_daily_sales: sql<number>`avg(${salesHistory.unitsSold})`,
      days_active: sql<number>`count(distinct ${salesHistory.date})`,
      last_sale_date: sql<Date>`max(${salesHistory.date})`,
    })
    .from(salesHistory)
    .innerJoin(skus, eq(salesHistory.skuId, skus.id))
    .innerJoin(pinCodes, eq(salesHistory.pinCode, pinCodes.pinCode))
    .groupBy(salesHistory.skuId, salesHistory.pinCode, skus.name, skus.category, pinCodes.areaName, pinCodes.region)
    .orderBy(desc(sql<number>`sum(${salesHistory.unitsSold})`));

  return results;
}

export async function getSKUsData() {
  const results = await db
    .select()
    .from(skus)
    .where(eq(skus.status, 'active'));

  return results;
}

export async function getPINCodesData() {
  const results = await db
    .select()
    .from(pinCodes)
    .where(eq(pinCodes.status, 'active'));

  return results;
}

export interface ForecastInputData {
  sales_history: SalesData[];
  inventory: InventoryData[];
  aggregated_sales: AggregatedSales[];
  skus: Awaited<ReturnType<typeof getSKUsData>>;
  pin_codes: Awaited<ReturnType<typeof getPINCodesData>>;
}

export async function getForecastInputData(): Promise<ForecastInputData> {
  const [sales_history, inventory, aggregated_sales, skus, pin_codes] = await Promise.all([
    getSalesHistoryData(90),
    getInventoryData(),
    getAggregatedSalesBySKU(),
    getSKUsData(),
    getPINCodesData(),
  ]);

  return {
    sales_history,
    inventory,
    aggregated_sales,
    skus,
    pin_codes,
  };
}
