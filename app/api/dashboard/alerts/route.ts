import { NextResponse } from 'next/server';
import { getLatestForecast } from '@/lib/db/forecasts';
import type { RestockAlert, ImmediateAction } from '@/types';

export interface AlertData {
  restock_alerts: RestockAlert[];
  immediate_actions: ImmediateAction[];
  generated_at: string;
}

export async function GET() {
  try {
    const latest = await getLatestForecast();
    if (!latest) {
      return NextResponse.json({ success: false, error: { code: 'NO_FORECAST', message: 'No forecast available' } }, { status: 404 });
    }

    const { forecastData, generatedAt } = latest;
    const generatedAtISO = generatedAt.toISOString();

    const response: AlertData = {
      restock_alerts: forecastData.restock_alerts ?? [],
      immediate_actions: forecastData.immediate_actions ?? [],
      generated_at: generatedAtISO,
    };

    return NextResponse.json({ success: true, data: response, generated_at: generatedAtISO });
  } catch (error) {
    console.error('[Dashboard Alerts] Error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load alerts' } }, { status: 500 });
  }
}
