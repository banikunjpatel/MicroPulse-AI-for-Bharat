import { NextRequest, NextResponse } from 'next/server';
import { getForecastInputData } from '@/lib/db/forecasts';
import { ai, getPrompt } from '@/lib/ai';
import type { ForecastData } from '@/types';
import { mockForecastData } from '@/lib/mock-data/forecasts';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const forceMock = searchParams.get('mock') === 'true';

    const inputData = await getForecastInputData();

    if (!ai.isEnabled() || forceMock) {
      console.log('[Forecasts] OpenRouter is disabled, returning mock data');
      return NextResponse.json({
        success: true,
        data: mockForecastData,
        source: 'mock',
      });
    }

    const systemPrompt = getPrompt('forecasts', { period: '30 days' });

    const dataSummary = `
Sales History (last 90 days):
- Total records: ${inputData.sales_history.length}
- Unique SKUs: ${inputData.skus.length}
- Unique PIN codes: ${inputData.pin_codes.length}

Top SKUs by sales:
${inputData.aggregated_sales.slice(0, 10).map(s => `- ${s.sku_name} (${s.category}): ${Number(s.total_units_sold)} units, ${Number(s.days_active)} days`).join('\n')}

Current Inventory:
${inputData.inventory.slice(0, 10).map(i => `- ${i.sku_name} @ ${i.pin_code}: ${i.stock_on_hand} units (reorder: ${i.reorder_point})`).join('\n')}

PIN Codes Coverage:
${inputData.pin_codes.map(p => `- ${p.pinCode}: ${p.areaName}, ${p.region}`).join('\n')}
    `.trim();

    const userMessage = `Based on the following data, generate demand forecasts for the next 30 days. ${dataSummary}`;

    console.log('[Forecasts] Sending request to OpenRouter...');
    console.log('[Forecasts] Model:', ai.getModel());
    console.log('[Forecasts] Input data:', {
      salesHistoryCount: inputData.sales_history.length,
      skuCount: inputData.skus.length,
      pinCodeCount: inputData.pin_codes.length,
      inventoryCount: inputData.inventory.length,
    });

    const llmRequest = {
      model: ai.getModel(),
      systemPromptLength: systemPrompt.length,
      userMessageLength: userMessage.length,
    };
    console.log('[Forecasts] LLM Request:', JSON.stringify(llmRequest, null, 2));

    const response = await ai.chat({
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    console.log('[Forecasts] LLM Response received');
    console.log('[Forecasts] Response length:', response.content.length);
    console.log('[Forecasts] Usage:', response.usage);

    let forecastData: ForecastData;

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        forecastData = JSON.parse(jsonMatch[0]);
        console.log('[Forecasts] Successfully parsed JSON from LLM response');
        console.log('[Forecasts] Forecast data:', JSON.stringify(forecastData, null, 2));
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[Forecasts] Failed to parse LLM response as JSON:', response.content);
      return NextResponse.json({
        success: true,
        data: mockForecastData,
        source: 'fallback',
        warning: 'Failed to parse LLM response, using mock data',
      });
    }

    console.log('[Forecasts] Forecast generated successfully');
    return NextResponse.json({
      success: true,
      data: forecastData,
      source: 'llm',
    });
  } catch (error) {
    console.error('[Forecasts] API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORECAST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate forecasts',
        },
      },
      { status: 500 }
    );
  }
}
