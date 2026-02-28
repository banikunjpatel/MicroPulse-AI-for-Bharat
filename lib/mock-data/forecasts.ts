import type { ForecastData, ForecastPrediction, RestockAlert, TrendAnalysis } from '@/types';

export const mockForecastData: ForecastData = {
  generated_at: new Date().toISOString(),
  period: {
    start: '2026-03-01',
    end: '2026-03-31',
    days: 30,
  },
  predictions: [
    {
      sku_id: 'SKU-001',
      sku_name: 'Limca 500ml',
      pin_code: '395001',
      area_name: 'Surat — Adajan',
      predicted_demand: 142,
      confidence: 0.87,
      trend: 'increasing',
      change_percent: 15,
    },
    {
      sku_id: 'SKU-001',
      sku_name: 'Limca 500ml',
      pin_code: '395002',
      area_name: 'Surat — Varachha',
      predicted_demand: 98,
      confidence: 0.82,
      trend: 'stable',
      change_percent: 3,
    },
    {
      sku_id: 'SKU-002',
      sku_name: 'Coca Cola 300ml',
      pin_code: '395001',
      area_name: 'Surat — Adajan',
      predicted_demand: 186,
      confidence: 0.91,
      trend: 'increasing',
      change_percent: 22,
    },
    {
      sku_id: 'SKU-003',
      sku_name: 'Lays Classic 50g',
      pin_code: '395001',
      area_name: 'Surat — Adajan',
      predicted_demand: 75,
      confidence: 0.78,
      trend: 'decreasing',
      change_percent: -8,
    },
    {
      sku_id: 'SKU-004',
      sku_name: 'Amul Milk 1L',
      pin_code: '400001',
      area_name: 'Mumbai — Fort',
      predicted_demand: 245,
      confidence: 0.94,
      trend: 'stable',
      change_percent: 5,
    },
  ] as ForecastPrediction[],
  restock_alerts: [
    {
      sku_id: 'SKU-001',
      sku_name: 'Limca 500ml',
      pin_code: '395002',
      current_stock: 45,
      reorder_point: 100,
      recommended_units: 150,
      urgency: 'high',
      days_until_stockout: 3,
    },
    {
      sku_id: 'SKU-003',
      sku_name: 'Lays Classic 50g',
      pin_code: '395001',
      current_stock: 30,
      reorder_point: 80,
      recommended_units: 100,
      urgency: 'medium',
      days_until_stockout: 7,
    },
    {
      sku_id: 'SKU-005',
      sku_name: 'Colgate Toothpaste 100g',
      pin_code: '395001',
      current_stock: 20,
      reorder_point: 50,
      recommended_units: 80,
      urgency: 'high',
      days_until_stockout: 2,
    },
  ] as RestockAlert[],
  trends: {
    beverages: {
      direction: 'up',
      change_percent: 18,
      description: 'Strong demand due to summer season',
    },
    snacks: {
      direction: 'stable',
      change_percent: 2,
      description: 'Steady demand across regions',
    },
    dairy: {
      direction: 'up',
      change_percent: 8,
      description: 'Morning milk demand increasing',
    },
    personal_care: {
      direction: 'stable',
      change_percent: 0,
      description: 'Normal demand patterns',
    },
    household: {
      direction: 'down',
      change_percent: -5,
      description: 'Post-festive season slowdown',
    },
  } as Record<string, TrendAnalysis>,
  summary: {
    total_predictions: 5,
    high_urgency_alerts: 2,
    avg_confidence: 0.86,
    top_growing_skus: [
      { sku_id: 'SKU-002', change: 22 },
      { sku_id: 'SKU-001', change: 15 },
    ],
  },
};

export const mockHistoricalTrends = [
  { month: 'Oct 2025', sales: 12450, forecast: 12800 },
  { month: 'Nov 2025', sales: 15200, forecast: 14800 },
  { month: 'Dec 2025', sales: 18500, forecast: 18200 },
  { month: 'Jan 2026', sales: 14200, forecast: 14500 },
  { month: 'Feb 2026', sales: 13800, forecast: 14000 },
];

export const mockCategoryBreakdown = [
  { category: 'Beverages', current: 45000, predicted: 52000, change: 15.6 },
  { category: 'Dairy', current: 28000, predicted: 30200, change: 7.9 },
  { category: 'Snacks', current: 22000, predicted: 22500, change: 2.3 },
  { category: 'Personal Care', current: 15000, predicted: 15000, change: 0 },
  { category: 'Household', current: 18000, predicted: 17100, change: -5 },
];
