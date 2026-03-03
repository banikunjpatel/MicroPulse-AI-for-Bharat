import type { WeatherData, CurrentWeather, ForecastDay, WeatherError } from './types';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1';
const WEATHER_URL = 'https://api.open-meteo.com/v1';

const PINCODE_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  '395001': { lat: 21.1702, lon: 72.8311, name: 'Surat' },
  '395002': { lat: 21.1949, lon: 72.8085, name: 'Surat Varachha' },
  '395003': { lat: 21.1875, lon: 72.8234, name: 'Surat Railway Station' },
  '395004': { lat: 21.2254, lon: 72.8023, name: 'Katargam' },
  '395005': { lat: 21.1962, lon: 72.8368, name: 'Surat City' },
  '395006': { lat: 21.2092, lon: 72.8554, name: 'Varachha' },
  '395007': { lat: 21.1865, lon: 72.8232, name: 'City Light' },
  '395008': { lat: 21.1768, lon: 72.8012, name: 'Adajan' },
  '395009': { lat: 21.1598, lon: 72.8098, name: 'Adajan' },
  '400001': { lat: 18.9352, lon: 72.8354, name: 'Mumbai Fort' },
  '302001': { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
  '600001': { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
  '110001': { lat: 28.6139, lon: 77.209, name: 'Delhi' },
  '700001': { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
  '500001': { lat: 17.385, lon: 78.4867, name: 'Hyderabad' },
  '411001': { lat: 18.5204, lon: 73.8567, name: 'Pune' },
  '380001': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
  '560001': { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
};

class WeatherClient {
  private enabled: boolean = true;
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private cacheTimeout: number = 15 * 60 * 1000;

  constructor() {
    console.log('[Weather] Open-Meteo Client initialized (free, no API key required)');
    console.log('[Weather] Using static PIN code coordinates for Indian cities');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getCacheKey(pinCode: string): string {
    return `weather_${pinCode}`;
  }

  private getFromCache(pinCode: string): WeatherData | null {
    const key = this.getCacheKey(pinCode);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(pinCode: string, data: WeatherData): void {
    const key = this.getCacheKey(pinCode);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCoordinatesFromPINCode(pinCode: string): { lat: number; lon: number; name: string } | null {
    const normalized = pinCode.trim();
    
    if (PINCODE_COORDS[normalized]) {
      console.log(`[Weather] Found static coordinates for PIN: ${normalized} -> ${PINCODE_COORDS[normalized].name}`);
      return PINCODE_COORDS[normalized];
    }

    console.log(`[Weather] No static coordinates for PIN: ${normalized}, trying geocoding API...`);
    return null;
  }

  private async getCoordinatesFromAPI(cityName: string): Promise<{ lat: number; lon: number; name: string } | null> {
    try {
      const url = `${GEO_URL}/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json&country=IN`;
      console.log(`[Weather] Geocoding: ${cityName}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[Weather] Geocoding API error:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.latitude,
          lon: result.longitude,
          name: result.name || cityName,
        };
      }
    } catch (error) {
      console.error('[Weather] Geocoding fetch error:', error);
    }
    return null;
  }

  private async getCoordinates(pinCode: string): Promise<{ lat: number; lon: number; name: string } | null> {
    const staticCoords = this.getCoordinatesFromPINCode(pinCode);
    if (staticCoords) {
      return staticCoords;
    }

    return this.getCoordinatesFromAPI(pinCode);
  }

  async getCurrentWeather(pinCode: string): Promise<CurrentWeather | null> {
    const cached = this.getFromCache(pinCode);
    if (cached?.current) {
      console.log(`[Weather] Cache hit for PIN: ${pinCode}`);
      return cached.current;
    }

    try {
      const coords = await this.getCoordinates(pinCode);
      if (!coords) {
        console.log(`[Weather] Could not get coordinates for PIN: ${pinCode}`);
        return null;
      }

      console.log(`[Weather] Fetching weather for PIN: ${pinCode}, Location: ${coords.name} (${coords.lat}, ${coords.lon})`);

      const url = `${WEATHER_URL}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,rain,weather_code,wind_speed_10m&timezone=Asia/Kolkata`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[Weather] API error:', response.status);
        return null;
      }

      const data = await response.json();
      
      const current: CurrentWeather = {
        temp: Math.round(data.current.temperature_2m),
        feels_like: Math.round(data.current.apparent_temperature),
        temp_min: Math.round(data.current.temperature_2m - 2),
        temp_max: Math.round(data.current.temperature_2m + 2),
        pressure: 1013,
        humidity: data.current.relative_humidity_2m,
        wind_speed: Math.round(data.current.wind_speed_10m),
        wind_deg: 0,
        clouds: 0,
        visibility: 10000,
        condition: {
          id: data.current.weather_code || 0,
          main: this.getWeatherMain(data.current.weather_code),
          description: this.getWeatherDescription(data.current.weather_code),
          icon: this.getWeatherIcon(data.current.weather_code),
        },
        sunrise: Date.now() / 1000,
        sunset: Date.now() / 1000 + 43200,
        timestamp: Date.now() / 1000,
      };

      console.log(`[Weather] Current weather for ${coords.name}: ${current.temp}°C, ${current.condition.description}, Humidity: ${current.humidity}%`);
      return current;
    } catch (error) {
      console.error('[Weather] Current weather fetch error:', error);
      return null;
    }
  }

  async getForecast(pinCode: string, days: number = 5): Promise<ForecastDay[]> {
    const cached = this.getFromCache(pinCode);
    if (cached?.forecast && cached.forecast.length > 0) {
      return cached.forecast.slice(0, days);
    }

    try {
      const coords = await this.getCoordinates(pinCode);
      if (!coords) {
        console.log(`[Weather] Could not get coordinates for forecast, PIN: ${pinCode}`);
        return [];
      }

      console.log(`[Weather] Fetching 7-day forecast for PIN: ${pinCode}, Location: ${coords.name}`);

      const url = `${WEATHER_URL}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,rain_sum&timezone=Asia/Kolkata&forecast_days=7`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[Weather] Forecast API error:', response.status);
        return [];
      }

      const data = await response.json();
      
      const forecast: ForecastDay[] = [];
      const dates = data.daily.time || [];
      const weatherCodes = data.daily.weather_code || [];
      const maxTemps = data.daily.temperature_2m_max || [];
      const minTemps = data.daily.temperature_2m_min || [];
      const humidities = data.daily.relative_humidity_2m_mean || [];
      const rains = data.daily.rain_sum || [];

      for (let i = 0; i < Math.min(dates.length, days); i++) {
        forecast.push({
          date: dates[i],
          temp_min: Math.round(minTemps[i]),
          temp_max: Math.round(maxTemps[i]),
          humidity: Math.round(humidities[i] || 50),
          wind_speed: 10,
          condition: {
            id: weatherCodes[i] || 0,
            main: this.getWeatherMain(weatherCodes[i]),
            description: this.getWeatherDescription(weatherCodes[i]),
            icon: this.getWeatherIcon(weatherCodes[i]),
          },
          rainfall_mm: Math.round((rains[i] || 0) * 10) / 10,
          pop: Math.min(100, Math.round((rains[i] || 0) * 20)),
        });
      }

      console.log(`[Weather] Forecast fetched for ${coords.name}: ${forecast.length} days`);
      console.log(`[Weather] Forecast details:`, forecast.map(f => `${f.date}: ${f.temp_min}°C - ${f.temp_max}°C, ${f.condition.description}`).join(', '));
      
      return forecast;
    } catch (error) {
      console.error('[Weather] Forecast fetch error:', error);
      return [];
    }
  }

  private getWeatherMain(code: number): string {
    const codes: Record<number, string> = {
      0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing Rime Fog',
      51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
      61: 'Rain', 63: 'Rain', 65: 'Rain',
      71: 'Snow', 73: 'Snow', 75: 'Snow',
      80: 'Rain Showers', 81: 'Rain Showers', 82: 'Rain Showers',
      95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
    };
    return codes[code] || 'Unknown';
  }

  private getWeatherDescription(code: number): string {
    const descriptions: Record<number, string> = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
      80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
    };
    return descriptions[code] || 'Unknown';
  }

  private getWeatherIcon(code: number): string {
    const icons: Record<number, string> = {
      0: '01d', 1: '01d', 2: '02d', 3: '04d',
      45: '50d', 48: '50d',
      51: '09d', 53: '09d', 55: '09d',
      61: '10d', 63: '10d', 65: '10d',
      71: '13d', 73: '13d', 75: '13d',
      80: '09d', 81: '09d', 82: '09d',
      95: '11d', 96: '11d', 99: '11d',
    };
    return icons[code] || '01d';
  }

  async getWeatherData(pinCode: string): Promise<WeatherData | null> {
    const cached = this.getFromCache(pinCode);
    if (cached) {
      return cached;
    }

    const coords = await this.getCoordinates(pinCode);
    if (!coords) {
      console.log(`[Weather] Could not resolve PIN: ${pinCode}`);
      return null;
    }

    console.log(`[Weather] Fetching weather data for PIN: ${pinCode} (${coords.name})`);

    const [current, forecast] = await Promise.all([
      this.getCurrentWeather(pinCode),
      this.getForecast(pinCode, 5),
    ]);

    const weatherData: WeatherData = {
      pin_code: pinCode,
      location: coords.name,
      current,
      forecast,
    };

    this.setCache(pinCode, weatherData);
    console.log(`[Weather] Cached weather for PIN: ${pinCode}`);
    return weatherData;
  }

  async getWeatherForMultiplePincodes(pinCodes: string[]): Promise<WeatherData[]> {
    console.log(`[Weather] ════════════════════════════════════════════════════`);
    console.log(`[Weather] Fetching weather for ${pinCodes.length} PIN codes`);
    console.log(`[Weather] PIN codes: ${pinCodes.join(', ')}`);
    console.log(`[Weather] ════════════════════════════════════════════════════`);
    
    const results: WeatherData[] = [];
    
    for (const pinCode of pinCodes) {
      const data = await this.getWeatherData(pinCode);
      if (data) {
        results.push(data);
      }
    }

    console.log(`[Weather] ════════════════════════════════════════════════════`);
    console.log(`[Weather] Successfully fetched weather for ${results.length}/${pinCodes.length} PIN codes`);
    console.log(`[Weather] Locations: ${results.map(r => `${r.pin_code} (${r.location})`).join(', ')}`);
    console.log(`[Weather] ════════════════════════════════════════════════════`);
    
    return results;
  }
}

export const weatherClient = new WeatherClient();
export default weatherClient;
