import type { NewsData, NewsArticle } from './types';

const RSS_FEEDS = [
  'https://www.divyabhaskar.co.in/rss-v1--category-1035.xml',
  'https://www.gujaratsamachar.com/rss/category/gujarat',
  'https://www.news18.com/rss/',
  'https://www.ndtv.com/rss',
];

const FESTIVAL_KEYWORDS = [
  'holi', 'diwali', 'eid', 'navratri', 'durga puja', 'ganesh chaturthi',
  'onam', 'pongal', 'christmas', 'ramzan', 'muharram',
  'festival', 'festival sale', 'festival season',
  'wedding season', 'festive season',
];

const WEATHER_KEYWORDS = [
  'monsoon', 'rain', 'rainfall', 'cyclone', 'storm',
  'heatwave', 'summer', 'winter', 'weather',
  'flood', ' IMD ', 'meteorological',
];

class NewsClient {
  private enabled: boolean = true;
  private cache: { data: NewsData; timestamp: number } | null = null;
  private cacheTimeout: number = 6 * 60 * 60 * 1000;

  constructor() {
    console.log('[News] RSS Client initialized (free, no API key required)');
    console.log('[News] Using RSS feeds:', RSS_FEEDS.join(', '));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private async fetchRSS(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MicroPulse/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }
    
    return response.text();
  }

  private parseRSS(xml: string): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null && articles.length < 20) {
      const item = match[1];
      
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i);
      const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/i);
      const linkMatch = item.match(/<link>(.*?)<\/link>/i);
      const sourceMatch = item.match(/<source>(.*?)<\/source>/i);
      
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      const description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      const url = linkMatch ? linkMatch[1].trim() : '';
      const source = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
      
      if (title) {
        articles.push({
          title,
          description: description ? description.replace(/<[^>]*>/g, '').substring(0, 200) : null,
          pubDate,
          source,
          url,
        });
      }
    }
    
    return articles;
  }

  private isRelevantArticle(article: NewsArticle): boolean {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    
    const festivalMatch = FESTIVAL_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
    const weatherMatch = WEATHER_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
    
    return festivalMatch || weatherMatch;
  }

  async getNews(keywords: string[] = []): Promise<NewsData> {
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheTimeout) {
      console.log('[News] Returning cached news');
      return this.cache.data;
    }

    console.log('[News] ════════════════════════════════════════════════════');
    console.log('[News] Fetching news from RSS feeds');
    console.log('[News] Feeds:', RSS_FEEDS);
    console.log('[News] ════════════════════════════════════════════════════');

    try {
      const allArticles: NewsArticle[] = [];
      
      for (const feedUrl of RSS_FEEDS) {
        try {
          console.log(`[News] Fetching: ${feedUrl}`);
          const xml = await this.fetchRSS(feedUrl);
          const articles = this.parseRSS(xml);
          console.log(`[News] Found ${articles.length} articles from ${feedUrl}`);
          allArticles.push(...articles);
        } catch (error) {
          console.error(`[News] Error fetching ${feedUrl}:`, error);
        }
      }

      const relevantArticles = allArticles
        .filter(article => this.isRelevantArticle(article))
        .filter((article, index, self) => 
          index === self.findIndex(a => a.title === article.title)
        )
        .slice(0, 15);

      console.log(`[News] Found ${relevantArticles.length} relevant articles (festivals/weather)`);
      console.log(`[News] Articles:`, relevantArticles.map(a => a.title.substring(0, 50)).join(', '));
      console.log('[News] ════════════════════════════════════════════════════');

      const newsData: NewsData = {
        articles: relevantArticles,
        fetched_at: new Date().toISOString(),
      };

      this.cache = { data: newsData, timestamp: Date.now() };
      
      return newsData;
    } catch (error) {
      console.error('[News] Fetch error:', error);
      return { articles: [], fetched_at: new Date().toISOString() };
    }
  }

  async getFestivalNews(): Promise<NewsData> {
    return this.getNews(FESTIVAL_KEYWORDS);
  }

  async getWeatherNews(): Promise<NewsData> {
    return this.getNews(WEATHER_KEYWORDS);
  }

  async getEventNews(): Promise<NewsData> {
    return this.getNews(['wedding', 'event', 'sale', 'shopping']);
  }
}

export const newsClient = new NewsClient();
export default newsClient;
