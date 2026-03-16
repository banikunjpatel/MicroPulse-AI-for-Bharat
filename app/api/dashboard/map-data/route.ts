import { NextResponse } from 'next/server';
import { getLatestForecast } from '@/lib/db/forecasts';
import { getPINCodesData } from '@/lib/db/forecasts';
import { geocodeByAreaAndRegion } from '@/lib/geocode';
import type { ForecastPrediction, RestockAlert, ImmediateAction } from '@/types';

export interface PinMapPoint {
  pincode: string;
  area_name: string;
  lat: number;
  lng: number;
  /** Total predicted demand across all SKUs for this pin */
  total_predicted_demand: number;
  /** Average confidence across predictions for this pin */
  avg_confidence: number;
  /** Dominant trend for this pin */
  trend: 'increasing' | 'stable' | 'decreasing';
  /** Max change_percent among predictions for this pin */
  max_change_percent: number;
  predictions: ForecastPrediction[];
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

    // Group predictions by pin code
    const byPin = new Map<string, {
      area_name: string;
      predictions: ForecastPrediction[];
      restock_alerts: RestockAlert[];
    }>();

    for (const p of forecastData.predictions ?? []) {
      if (!byPin.has(p.pin_code)) {
        byPin.set(p.pin_code, { area_name: p.area_name, predictions: [], restock_alerts: [] });
      }
      byPin.get(p.pin_code)!.predictions.push(p);
    }

    for (const a of forecastData.restock_alerts ?? []) {
      if (byPin.has(a.pin_code)) {
        byPin.get(a.pin_code)!.restock_alerts.push(a);
      }
    }

    const points: PinMapPoint[] = [];

    // Build a lookup of pincode → {areaName, region} from the actual DB records
    // This is the source of truth — not the LLM-generated area names
    const dbPinCodes = await getPINCodesData();
    const dbPinMap = new Map(dbPinCodes.map(p => [p.pinCode, { areaName: p.areaName, region: p.region }]));

    // Geocode using real area+region from DB (much more accurate than raw pincode lookup)
    for (const [pincode, data] of byPin.entries()) {
      const dbPin = dbPinMap.get(pincode);
      // Use DB area name if available, fall back to LLM-provided area name
      const areaName = dbPin?.areaName ?? data.area_name;
      const region = dbPin?.region ?? '';

      const coords = await geocodeByAreaAndRegion(pincode, areaName, region);
      if (!coords) continue;

      const totalDemand = data.predictions.reduce((s, p) => s + p.predicted_demand, 0);
      const avgConf = data.predictions.reduce((s, p) => s + p.confidence, 0) / (data.predictions.length || 1);
      const maxChange = data.predictions.length ? Math.max(...data.predictions.map(p => p.change_percent)) : 0;

      // Dominant trend: majority vote
      const trendCounts = { increasing: 0, stable: 0, decreasing: 0 };
      for (const p of data.predictions) trendCounts[p.trend]++;
      const trend = (Object.entries(trendCounts).sort(([, av]: [string, number], [, bv]: [string, number]) => bv - av)[0][0]) as PinMapPoint['trend'];

      // Filter immediate_actions relevant to this pin
      const actions = (forecastData.immediate_actions ?? []).filter(
        (a: ImmediateAction) => !a.pin_codes || a.pin_codes.length === 0 || a.pin_codes.includes(pincode)
      );

      points.push({
        pincode,
        area_name: areaName,
        lat: coords.lat,
        lng: coords.lng,
        total_predicted_demand: totalDemand,
        avg_confidence: Math.round(avgConf * 100) / 100,
        trend,
        max_change_percent: maxChange,
        predictions: data.predictions,
        restock_alerts: data.restock_alerts,
        immediate_actions: actions,
        generated_at: generatedAtISO,
      });
    }

    return NextResponse.json({ success: true, data: points, generated_at: generatedAtISO });
  } catch (error) {
    console.error('[Dashboard Map] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load map data' } },
      { status: 500 }
    );
  }
}
