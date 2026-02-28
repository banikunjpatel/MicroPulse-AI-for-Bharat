import type { PromptTemplate, PromptParams } from './types';

const prompts: Record<string, PromptTemplate> = {
  default: {
    name: 'default',
    description: 'Default system prompt for general conversations',
    getPrompt: () =>
      'You are a helpful AI assistant. Provide clear, concise, and accurate responses.',
  },

  salesAnalysis: {
    name: 'salesAnalysis',
    description: 'System prompt for sales data analysis',
    getPrompt: (params?: PromptParams) => {
      const year = params?.year || new Date().getFullYear();
      return `You are a sales data analyst expert. Analyze the provided sales data and provide insights.
- Focus on trends, patterns, and anomalies
- Provide actionable recommendations
- Use clear and professional language
- Include relevant statistics when available
- Current analysis year: ${year}`;
    },
  },

  dataSummary: {
    name: 'dataSummary',
    description: 'System prompt for summarizing data',
    getPrompt: () =>
      'You are a data summarization expert. Provide clear, concise summaries of the given data. Focus on key insights and trends.',
  },

  businessInsights: {
    name: 'businessInsights',
    description: 'System prompt for generating business insights',
    getPrompt: () =>
      'You are a business intelligence expert. Analyze the given data and provide actionable business insights. Focus on growth opportunities, cost optimization, and market trends.',
  },

  forecasting: {
    name: 'forecasting',
    description: 'System prompt for forecasting predictions',
    getPrompt: (params?: PromptParams) => {
      const period = params?.period || 'monthly';
      return `You are a forecasting expert. Based on historical data, predict future trends.
- Consider seasonality and trends
- Provide confidence levels where possible
- Explain your reasoning
- Forecast period: ${period}`;
    },
  },

  customerSegmentation: {
    name: 'customerSegmentation',
    description: 'System prompt for customer segmentation analysis',
    getPrompt: () =>
      'You are a customer segmentation expert. Analyze customer data and identify distinct segments based on behavior, demographics, and preferences. Provide actionable recommendations for each segment.',
  },

  competitiveAnalysis: {
    name: 'competitiveAnalysis',
    description: 'System prompt for competitive analysis',
    getPrompt: () =>
      'You are a competitive analysis expert. Analyze market data and provide insights on competitive landscape, market share, and opportunities.',
  },

  forecasts: {
    name: 'forecasts',
    description: 'System prompt for demand forecasting with JSON output',
    getPrompt: (params?: PromptParams) => {
      const period = params?.period || '30 days';
      return `You are a demand forecasting expert for retail inventory management. Your task is to analyze historical sales data, current inventory levels, SKU information, and PIN code data to generate accurate demand forecasts.

IMPORTANT: You MUST respond ONLY with valid JSON. Do not include any explanatory text outside of the JSON structure.

Analyze the following data:
1. Sales history - historical sales transactions with dates, quantities, and prices
2. Inventory - current stock levels and reorder points for each SKU per location
3. SKUs - product catalog with categories and costs
4. PIN codes - geographic coverage areas

Generate a forecast for the next ${period} with this EXACT JSON structure:

{
  "generated_at": "ISO timestamp",
  "period": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD", 
    "days": number
  },
  "predictions": [
    {
      "sku_id": "string",
      "sku_name": "string", 
      "pin_code": "string",
      "area_name": "string",
      "predicted_demand": number,
      "confidence": number (0-1),
      "trend": "increasing" | "stable" | "decreasing",
      "change_percent": number
    }
  ],
  "restock_alerts": [
    {
      "sku_id": "string",
      "sku_name": "string",
      "pin_code": "string",
      "current_stock": number,
      "reorder_point": number,
      "recommended_units": number,
      "urgency": "high" | "medium" | "low",
      "days_until_stockout": number
    }
  ],
  "trends": {
    "beverages": { "direction": "up" | "stable" | "down", "change_percent": number, "description": "string" },
    "snacks": { "direction": "up" | "stable" | "down", "change_percent": number, "description": "string" },
    "dairy": { "direction": "up" | "stable" | "down", "change_percent": number, "description": "string" },
    "personal_care": { "direction": "up" | "stable" | "down", "change_percent": number, "description": "string" },
    "household": { "direction": "up" | "stable" | "down", "change_percent": number, "description": "string" }
  },
  "summary": {
    "total_predictions": number,
    "high_urgency_alerts": number,
    "avg_confidence": number,
    "top_growing_skus": [{ "sku_id": "string", "change": number }]
  }
}

Guidelines:
- Consider seasonal trends and patterns in the data
- Factor in lead times for restocking
- Flag items where current stock is below reorder point
- Calculate predicted demand based on historical averages adjusted for trends
- Assign confidence scores based on data quality and consistency
- Identify top-performing and underperforming SKUs
- Focus on high-priority restock alerts (stock below reorder point, high sales velocity)

Respond ONLY with valid JSON. No markdown formatting, no explanations.`;
    },
  },
};

export function getPrompt(name: string, params?: PromptParams): string {
  const prompt = prompts[name];
  if (!prompt) {
    console.warn(`Prompt "${name}" not found. Using default prompt.`);
    return prompts.default.getPrompt();
  }
  return prompt.getPrompt(params);
}

export function getPromptTemplate(name: string): PromptTemplate | undefined {
  return prompts[name];
}

export function listPrompts(): PromptTemplate[] {
  return Object.values(prompts);
}

export function registerPrompt(template: PromptTemplate): void {
  prompts[template.name] = template;
}

export { prompts };
