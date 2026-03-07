import { NextRequest, NextResponse } from 'next/server';
import { getLatestForecast } from '@/lib/db/forecasts';

export async function GET(request: NextRequest) {
  try {
    console.log('[Forecasts] Fetching latest forecast from database...');

    const latestForecast = await getLatestForecast();

    if (!latestForecast) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_FORECAST_FOUND',
            message: 'No forecasts available. Please generate a forecast first.',
          },
        },
        { status: 404 }
      );
    }

    console.log('[Forecasts] Latest forecast found:', {
      id: latestForecast.id,
      generatedAt: latestForecast.generatedAt,
    });

    return NextResponse.json({
      success: true,
      data: latestForecast.forecastData,
      forecast_id: latestForecast.id,
      generated_at: latestForecast.generatedAt,
    });
  } catch (error) {
    console.error('[Forecasts] API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch latest forecast',
        },
      },
      { status: 500 }
    );
  }
}
