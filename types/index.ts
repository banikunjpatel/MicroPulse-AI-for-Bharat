export type SKUCategory = 'beverages' | 'snacks' | 'dairy' | 'personal_care' | 'household' | 'other';

export interface SKU {
  id: string;
  name: string;
  category: SKUCategory;
  unit_cost_paise: number;
  lead_time_days: number;
  status: 'active' | 'inactive' | 'no_history';
  created_at: string;
  updated_at: string;
}

export interface PINCode {
  pin_code: string;
  area_name: string;
  region: string;
  store_count: number;
  status: 'active' | 'inactive';
}

export interface InventoryRecord {
  sku_id: string;
  pin_code: string;
  stock_on_hand: number;
  reorder_point: number;
  last_updated: string;
  sku_name?: string;
  category?: SKUCategory;
}

export type InventoryStatus = 'healthy' | 'low' | 'critical';

export interface SalesHistoryUploadSession {
  session_id: string;
  s3_key: string;
  original_filename: string;
  row_count: number;
  detected_columns: string[];
  status: 'uploaded' | 'mapped' | 'validated' | 'imported';
  created_at: string;
}

export interface ColumnMapping {
  date_col: string;
  sku_id_col: string;
  pin_code_col: string;
  units_sold_col: string;
  unit_price_col?: string;
}

export interface ReadinessCheck {
  skus: { ok: boolean; count: number };
  sales_history: { ok: boolean; days_of_data: number };
  inventory: { ok: boolean; missing_count: number };
  pin_codes: { ok: boolean; count: number };
  all_clear: boolean;
}

export const SKU_CATEGORIES: { value: SKUCategory; label: string }[] = [
  { value: 'beverages', label: 'Beverages' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'personal_care', label: 'Personal Care' },
  { value: 'household', label: 'Household' },
  { value: 'other', label: 'Other' },
];

export const REGIONS = [
  'Gujarat',
  'Maharashtra',
  'Rajasthan',
  'Tamil Nadu',
  'Karnataka',
  'Delhi',
  'West Bengal',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Other',
] as const;

export type Region = typeof REGIONS[number];

export interface ForecastPrediction {
  sku_id: string;
  sku_name: string;
  pin_code: string;
  area_name: string;
  predicted_demand: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  change_percent: number;
}

export interface RestockAlert {
  sku_id: string;
  sku_name: string;
  pin_code: string;
  current_stock: number;
  reorder_point: number;
  recommended_units: number;
  urgency: 'high' | 'medium' | 'low';
  days_until_stockout: number;
}

export interface TrendAnalysis {
  direction: 'up' | 'stable' | 'down';
  change_percent: number;
  description: string;
}

export interface ForecastSummary {
  total_predictions: number;
  high_urgency_alerts: number;
  avg_confidence: number;
  top_growing_skus: { sku_id: string; change: number }[];
}

export interface WeatherImpact {
  overall_impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface FestivalImpact {
  active_festivals: { name: string; date: string; impact: 'high' | 'medium' | 'low' }[];
  description: string;
}

export interface ForecastPeriod {
  start: string;
  end: string;
  days: number;
}

export type ImmediateActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ImmediateActionCategory =
  | 'restock'
  | 'pricing'
  | 'promotion'
  | 'logistics'
  | 'inventory_transfer'
  | 'supplier'
  | 'other';

export interface ImmediateAction {
  /** Short imperative title, e.g. "Reorder Amul Milk at PIN 400001" */
  title: string;
  /** Detailed description of what to do and why */
  description: string;
  priority: ImmediateActionPriority;
  category: ImmediateActionCategory;
  /** SKU id(s) this action relates to, if applicable */
  sku_ids?: string[];
  /** PIN code(s) this action relates to, if applicable */
  pin_codes?: string[];
  /** Suggested deadline, e.g. "within 24 hours" or "before 2024-04-10" */
  deadline?: string;
  /** Expected outcome if action is taken */
  expected_outcome?: string;
}

export interface ForecastData {
  generated_at: string;
  period: ForecastPeriod;
  predictions: ForecastPrediction[];
  restock_alerts: RestockAlert[];
  trends: Record<string, TrendAnalysis>;
  weather_impact?: WeatherImpact;
  festival_impact?: FestivalImpact;
  summary: ForecastSummary;
  forecast_technique: string;
  /** Prioritised list of actions the store owner should take immediately */
  immediate_actions?: ImmediateAction[];
}
