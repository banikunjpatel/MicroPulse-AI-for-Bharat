/**
 * Geocodes Indian PIN codes using a local database with accurate coordinates,
 * falling back to the Nominatim OpenStreetMap API when needed.
 *
 * Strategy (in order of reliability):
 *  1. Local PIN code database (official India Post data) → most accurate
 *  2. Nominatim free-text search using area+region → fallback
 *  3. Nominatim raw postalcode lookup → last resort
 *
 * Results are cached in-memory. Nominatim policy: max 1 req/sec.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

import indiaPincodes from './data/india-pincodes.json';

export interface Coords {
  lat: number;
  lng: number;
}

type PincodeData = {
  lat: number;
  lng: number;
  area: string;
  district: string;
  state: string;
};

const pincodeDb = indiaPincodes as Record<string, PincodeData>;
const cache = new Map<string, Coords | null>();
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA = 'MicroPulse-DemandForecast/1.0 (contact@micropulse.app)';

async function nominatimFetch(params: Record<string, string>): Promise<Coords | null> {
  const qs = new URLSearchParams({ ...params, format: 'json', limit: '1' }).toString();
  try {
    const res = await fetch(`${NOMINATIM}?${qs}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { lat: string; lon: string }[];
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Geocode using local PIN code database first, then fall back to Nominatim.
 * Results are cached by pincode.
 */
export async function geocodeByAreaAndRegion(
  pincode: string,
  areaName: string,
  region: string,
): Promise<Coords | null> {
  if (cache.has(pincode)) return cache.get(pincode)!;

  // Strategy 1: Local PIN code database (official India Post data)
  const localData = pincodeDb[pincode];
  if (localData) {
    const coords = { lat: localData.lat, lng: localData.lng };
    cache.set(pincode, coords);
    return coords;
  }

  // Strategy 2: Nominatim - "Varachha, Surat, Gujarat, India" style free-text
  const query = [areaName, region, 'India'].filter(Boolean).join(', ');
  let coords = await nominatimFetch({ q: query, countrycodes: 'in' });

  // Strategy 3: just the region (city/district) + India
  if (!coords && region) {
    coords = await nominatimFetch({ q: `${region}, India`, countrycodes: 'in' });
  }

  // Strategy 4: raw postalcode
  if (!coords) {
    coords = await nominatimFetch({ postalcode: pincode, country: 'India' });
  }

  cache.set(pincode, coords);
  return coords;
}

/**
 * Geocode a batch of pincodes sequentially, respecting the 1 req/sec rate limit.
 * Each entry provides the area name and region for accurate geocoding.
 */
export async function geocodeBatch(
  entries: { pincode: string; areaName: string; region: string }[],
): Promise<Map<string, Coords | null>> {
  const result = new Map<string, Coords | null>();

  for (let i = 0; i < entries.length; i++) {
    const { pincode, areaName, region } = entries[i];
    if (cache.has(pincode)) {
      result.set(pincode, cache.get(pincode)!);
      continue;
    }
    if (i > 0) await new Promise(r => setTimeout(r, 1100)); // rate limit
    const coords = await geocodeByAreaAndRegion(pincode, areaName, region);
    result.set(pincode, coords);
  }

  return result;
}
