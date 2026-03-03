export interface NewsArticle {
  title: string;
  description: string | null;
  pubDate: string;
  source: string;
  url: string;
}

export interface NewsData {
  articles: NewsArticle[];
  fetched_at: string;
}
