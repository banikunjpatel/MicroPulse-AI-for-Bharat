import { NextRequest, NextResponse } from 'next/server';
import { getEnrichedForecastData, formatWeatherForLLM, formatFestivalsForLLM, formatNewsForLLM } from '@/lib/forecasts/data';
import { ai, getPrompt } from '@/lib/ai';
import type { ForecastData } from '@/types';
import { mockForecastData } from '@/lib/mock-data/forecasts';
import { saveForecast } from '@/lib/db/forecasts';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const forceMock = searchParams.get('mock') === 'true';

    console.log('[Forecasts] Starting forecast generation...');

    const enrichedData = await getEnrichedForecastData();

    console.log('[Forecasts] Data sources:', {
      salesHistory: enrichedData.sales_history.length,
      skus: enrichedData.skus.length,
      pinCodes: enrichedData.pin_codes.length,
      inventory: enrichedData.inventory.length,
      weather: enrichedData.weather.length,
      festivals: enrichedData.festivals.festivals.length,
      news: enrichedData.news.articles.length,
    });

    if (!ai.isEnabled() || forceMock) {
      console.log('[Forecasts] OpenRouter is disabled, returning mock data');
      
      // Save mock forecast to database
      await saveForecast(mockForecastData);
      
      return NextResponse.json({
        success: true,
        data: mockForecastData,
        source: 'mock',
        data_sources: {
          weather: enrichedData.weather.length > 0,
          festivals: enrichedData.festivals.festivals.length > 0,
          news: enrichedData.news.articles.length > 0,
        },
      });
    }

    const systemPrompt = getPrompt('forecasts', { period: '30 days' });

    const dataSummary = `
SALES HISTORY (Last 90 days):
- Total records: ${enrichedData.sales_history.length}
- Unique SKUs: ${enrichedData.skus.length}
- Unique PIN codes: ${enrichedData.pin_codes.length}

TOP SKUs BY SALES:
${enrichedData.aggregated_sales.slice(0, 10).map(s => `- ${s.sku_name} (${s.category}): ${Number(s.total_units_sold)} units over ${Number(s.days_active)} days`).join('\n')}

CURRENT INVENTORY:
${enrichedData.inventory.slice(0, 10).map(i => `- ${i.sku_name} @ ${i.pin_code}: ${i.stock_on_hand} units (reorder at ${i.reorder_point})`).join('\n')}

PIN CODES COVERAGE:
${enrichedData.pin_codes.map(p => `- ${p.pinCode}: ${p.areaName}, ${p.region} (${p.storeCount} stores)`).join('\n')}

${formatWeatherForLLM(enrichedData.weather)}

${formatFestivalsForLLM(enrichedData.festivals)}

${formatNewsForLLM(enrichedData.news)}
    `.trim();

    const userMessage = `Based on the following comprehensive data (sales history, inventory, weather, festivals, and news), generate accurate demand forecasts for the next 30 days. Factor in weather conditions and upcoming festivals for accurate predictions.`;

    console.log('[Forecasts] Sending request to OpenRouter...');
    console.log('[Forecasts] Model:', ai.getModel());
    console.log('[Forecasts] Data summary length:', dataSummary.length);

    const response = await ai.chat({
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `${userMessage}\n\n${dataSummary}`,
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
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[Forecasts] Failed to parse LLM response as JSON:', response.content.substring(0, 500));
      
      // Save fallback forecast to database
      await saveForecast(mockForecastData);
      
      return NextResponse.json({
        success: true,
        data: mockForecastData,
        source: 'fallback',
        warning: 'Failed to parse LLM response, using mock data',
      });
    }

    console.log('[Forecasts] Forecast generated successfully');
    
    // Save forecast to database
    const savedForecast = await saveForecast(forecastData);
    console.log('[Forecasts] Saved to database with ID:', savedForecast.id);
    
    return NextResponse.json({
      success: true,
      data: forecastData,
      source: 'llm',
      forecast_id: savedForecast.id,
      data_sources: {
        weather: enrichedData.weather.length > 0,
        festivals: enrichedData.festivals.festivals.length > 0,
        news: enrichedData.news.articles.length > 0,
      },
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
