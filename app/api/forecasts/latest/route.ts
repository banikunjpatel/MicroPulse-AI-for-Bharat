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

    // The DB timestamp is in IST but JS Date treats it as UTC
    // We need to format it as IST without timezone conversion
    const dbDate = latestForecast.generatedAt;
    const year = dbDate.getUTCFullYear();
    const month = String(dbDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dbDate.getUTCDate()).padStart(2, '0');
    const hours = String(dbDate.getUTCHours()).padStart(2, '0');
    const minutes = String(dbDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(dbDate.getUTCSeconds()).padStart(2, '0');
    
    // Format as ISO-like string but treat the UTC values as IST
    const generatedAtIST = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;

    return NextResponse.json({
      success: true,
      data: latestForecast.forecastData,
      forecast_id: latestForecast.id,
      generated_at: generatedAtIST,
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
