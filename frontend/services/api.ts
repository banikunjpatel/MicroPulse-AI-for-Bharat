import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ForecastData {
  sku: string;
  pin: string;
  baseline_mape: number;
  context_mape: number;
  mape_improvement_percent: number;
  baseline_sigma: number;
  context_sigma: number;
  sigma_reduction_percent: number;
  context_signals?: {
    temperature: number;
    weekend: boolean;
    event: string;
    humidity?: number;
    is_holiday?: boolean;
  };
  market_context?: {
    city: string;
    lead_time_days: number;
    forecast_horizon_days: number;
    service_level_target: number;
    region?: string;
  };
  forecast_confidence?: number;
  recommendation?: {
    action: string;
    reason: string;
    confidence: number;
    impact?: string;
  };
  scenario_effect?: {
    scenario: string;
    demand_uplift: string;
    multiplier: number;
    description: string;
  };
  status: string;
}

export interface InventoryData {
  sku: string;
  pin: string;
  baseline_safety_stock: number;
  context_safety_stock: number;
  safety_stock_reduction_percent: number;
  baseline_working_capital: number;
  context_working_capital: number;
  working_capital_saved: number;
  working_capital_saved_percent: number;
  baseline_stockout_rate: number;
  context_stockout_rate: number;
  baseline_inventory_turnover: number;
  context_inventory_turnover: number;
  inventory_turnover_improvement_percent: number;
  status: string;
}

export interface ChatRequest {
  session_id?: string;
  sku: string;
  pin: string;
  question: string;
}

export interface ChatResponse {
  session_id: string;
  sku: string;
  pin: string;
  question: string;
  answer: string;
  status: string;
}

export const getForecast = async (sku: string, pin: string, scenario?: string): Promise<ForecastData> => {
  const params: any = { sku, pin };
  if (scenario && scenario !== 'normal') {
    params.scenario = scenario;
  }
  
  const response = await axios.get(`${API_BASE}/forecast`, { params });
  return response.data;
};

export const getInventory = async (sku: string, pin: string): Promise<InventoryData> => {
  const response = await axios.get(`${API_BASE}/inventory`, {
    params: { sku, pin }
  });
  return response.data;
};

export const askAI = async (payload: ChatRequest): Promise<ChatResponse> => {
  const response = await axios.post(`${API_BASE}/chat/ask`, payload);
  return response.data;
};

export const getAvailableCombinations = async () => {
  const response = await axios.get(`${API_BASE}/forecast/list`);
  return response.data;
};

export const getHeatmapData = async (sku: string) => {
  const response = await axios.get(`${API_BASE}/forecast/heatmap`, {
    params: { sku }
  });
  return response.data;
};
