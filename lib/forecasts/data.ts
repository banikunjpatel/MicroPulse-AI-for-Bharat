import { getForecastInputData, type ForecastInputData } from '@/lib/db/forecasts';
import { weatherClient } from '@/lib/weather';
import { festivalsClient } from '@/lib/festivals';
import { newsClient } from '@/lib/news';
import type { WeatherData } from '@/lib/weather';
import type { FestivalData } from '@/lib/festivals';
import type { NewsData } from '@/lib/news';

export interface EnrichedForecastData extends ForecastInputData {
  weather: WeatherData[];
  festivals: FestivalData;
  news: NewsData;
}

export async function getEnrichedForecastData(): Promise<EnrichedForecastData> {
  console.log('[Data] Fetching all data sources for forecasts...');

  const [forecastInput, weatherData, festivalData, newsData] = await Promise.all([
    getForecastInputData(),
    fetchWeatherData(),
    festivalsClient.getFestivals(),
    fetchNewsData(),
  ]);

  const enrichedData: EnrichedForecastData = {
    ...forecastInput,
    weather: weatherData,
    festivals: festivalData,
    news: newsData,
  };

  console.log('[Data] All data sources fetched successfully');
  return enrichedData;
}

async function fetchWeatherData(): Promise<WeatherData[]> {
  if (!weatherClient.isEnabled()) {
    console.log('[Data] Weather API not enabled, skipping');
    return [];
  }

  try {
    const pinCodes = await getUniquePincodes();
    if (pinCodes.length === 0) {
      console.log('[Data] No PIN codes found for weather');
      return [];
    }

    console.log('[Data] Fetching weather for', pinCodes.length, 'PIN codes');
    const weatherData = await weatherClient.getWeatherForMultiplePincodes(pinCodes);
    return weatherData;
  } catch (error) {
    console.error('[Data] Weather fetch error:', error);
    return [];
  }
}

async function fetchNewsData(): Promise<NewsData> {
  if (!newsClient.isEnabled()) {
    console.log('[Data] News API not enabled, skipping');
    return { articles: [], fetched_at: new Date().toISOString() };
  }

  try {
    const [festivalNews, weatherNews] = await Promise.all([
      newsClient.getFestivalNews(),
      newsClient.getWeatherNews(),
    ]);

    const allArticles = [...festivalNews.articles, ...weatherNews.articles];
    const uniqueArticles = allArticles.filter(
      (article, index, self) => index === self.findIndex(a => a.title === article.title)
    );

    return {
      articles: uniqueArticles.slice(0, 15),
      fetched_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Data] News fetch error:', error);
    return { articles: [], fetched_at: new Date().toISOString() };
  }
}

async function getUniquePincodes(): Promise<string[]> {
  const inputData = await getForecastInputData();
  const pinCodeSet = new Set<string>();

  for (const sale of inputData.sales_history) {
    pinCodeSet.add(sale.pin_code);
  }

  for (const pin of inputData.pin_codes) {
    pinCodeSet.add(pin.pinCode);
  }

  return Array.from(pinCodeSet).slice(0, 10);
}

export function formatWeatherForLLM(weatherData: WeatherData[]): string {
  if (weatherData.length === 0) {
    return 'No weather data available';
  }

  const lines: string[] = ['Weather Data (Current + 5-day forecast):'];
  
  for (const w of weatherData.slice(0, 5)) {
    lines.push(`\nLocation: ${w.location} (${w.pin_code}):`);
    
    if (w.current) {
      lines.push(`  Current: ${w.current.temp}°C, ${w.current.condition.description}, Humidity: ${w.current.humidity}%, Wind: ${w.current.wind_speed} km/h`);
    }
    
    if (w.forecast.length > 0) {
      lines.push(`  Forecast:`);
      for (const f of w.forecast) {
        lines.push(`    ${f.date}: ${f.temp_min}°C - ${f.temp_max}°C, ${f.condition.description}, Rain: ${f.rainfall_mm}mm, Rain chance: ${f.pop}%`);
      }
    }
  }

  return lines.join('\n');
}

export function formatFestivalsForLLM(festivalData: FestivalData): string {
  const lines: string[] = ['Festivals & Events:'];
  
  if (festivalData.festivals.length > 0) {
    lines.push('\nUpcoming Festivals:');
    for (const f of festivalData.festivals) {
      lines.push(`  - ${f.name} (${f.date}): ${f.description}, Impact: ${f.impact}, Regions: ${f.regions.join(', ')}`);
    }
  }

  if (festivalData.seasonal_factors.length > 0) {
    lines.push('\nSeasonal Factors:');
    for (const s of festivalData.seasonal_factors) {
      lines.push(`  - ${s.name}: ${s.description}, Impact: ${s.impact}, Regions: ${s.regions.join(', ')}`);
    }
  }

  return lines.join('\n');
}

export function formatNewsForLLM(newsData: NewsData): string {
  if (newsData.articles.length === 0) {
    return 'No relevant news available';
  }

  const lines: string[] = ['Recent News (Festival & Weather):'];
  
  for (const article of newsData.articles.slice(0, 10)) {
    const date = article.pubDate ? new Date(article.pubDate).toLocaleDateString() : 'Unknown';
    lines.push(`  - [${article.source}] ${article.title} (${date})`);
    if (article.description) {
      lines.push(`    ${article.description.substring(0, 150)}...`);
    }
  }

  return lines.join('\n');
}
