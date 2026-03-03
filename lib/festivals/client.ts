export interface Festival {
  name: string;
  date: string;
  type: 'national' | 'religious' | 'seasonal';
  impact: 'high' | 'medium' | 'low';
  description: string;
  regions: string[];
}

export interface FestivalData {
  festivals: Festival[];
  seasonal_factors: SeasonalFactor[];
  fetched_at: string;
}

export interface SeasonalFactor {
  name: string;
  type: 'season' | 'weather' | 'event';
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  regions: string[];
}

const INDIAN_FESTIVALS_2026: Festival[] = [
  {
    name: 'Republic Day',
    date: '2026-01-26',
    type: 'national',
    impact: 'low',
    description: 'National holiday, reduced business activity',
    regions: ['All India'],
  },
  {
    name: 'Mahashivratri',
    date: '2026-02-15',
    type: 'religious',
    impact: 'medium',
    description: 'Fasting and prayers, high devotion product sales',
    regions: ['North India', 'West India'],
  },
  {
    name: 'Holi',
    date: '2026-03-14',
    type: 'religious',
    impact: 'high',
    description: 'Festival of colors, massive spike in sweets, beverages, colors',
    regions: ['All India'],
  },
  {
    name: 'Ramzan (Eid-ul-Fitr)',
    date: '2026-03-21',
    type: 'religious',
    impact: 'high',
    description: 'Eid celebrations, high demand for sweets, gifts',
    regions: ['North India', 'West India', 'South India'],
  },
  {
    name: 'Gudi Padwa',
    date: '2026-03-22',
    type: 'religious',
    impact: 'medium',
    description: 'Maharashtra New Year, shopping for new items',
    regions: ['Maharashtra', 'Karnataka'],
  },
  {
    name: 'Ugadi',
    date: '2026-03-23',
    type: 'religious',
    impact: 'medium',
    description: 'Telugu New Year, special purchases',
    regions: ['Andhra Pradesh', 'Karnataka', 'Tamil Nadu'],
  },
  {
    name: 'Good Friday',
    date: '2026-04-03',
    type: 'religious',
    impact: 'low',
    description: 'Public holiday in some states',
    regions: ['Kerala', 'Goa', 'Northeast'],
  },
  {
    name: 'Easter',
    date: '2026-04-05',
    type: 'religious',
    impact: 'medium',
    description: 'Celebrations in Christian areas',
    regions: ['Kerala', 'Goa', 'Northeast', 'Metro cities'],
  },
  {
    name: 'Ambedkar Jayanti',
    date: '2026-04-14',
    type: 'national',
    impact: 'low',
    description: 'Social reformist commemoration',
    regions: ['All India'],
  },
  {
    name: 'Eid-ul-Adha',
    date: '2026-05-10',
    type: 'religious',
    impact: 'high',
    description: 'Bakrid, meat and gift purchases peak',
    regions: ['All India'],
  },
  {
    name: 'Buddha Purnima',
    date: '2026-05-23',
    type: 'religious',
    impact: 'low',
    description: 'Buddhist holiday',
    regions: ['Northeast India', 'Buddhist areas'],
  },
  {
    name: 'Rath Yatra',
    date: '2026-06-25',
    type: 'religious',
    impact: 'medium',
    description: 'Jagannath Rath Yatra in Puri',
    regions: ['Odisha', 'West Bengal'],
  },
  {
    name: 'Independence Day',
    date: '2026-08-15',
    type: 'national',
    impact: 'low',
    description: 'National holiday',
    regions: ['All India'],
  },
  {
    name: 'Janmashtami',
    date: '2026-08-26',
    type: 'religious',
    impact: 'medium',
    description: 'Krishna Jayanti, devotional items',
    regions: ['North India', 'West India'],
  },
  {
    name: 'Ganesh Chaturthi',
    date: '2026-09-09',
    type: 'religious',
    impact: 'high',
    description: '10-day festival, high sweets and decoration sales',
    regions: ['Maharashtra', 'Karnataka', 'Andhra Pradesh'],
  },
  {
    name: 'Onam',
    date: '2026-09-13',
    type: 'religious',
    impact: 'high',
    description: 'Kerala harvest festival, massive shopping',
    regions: ['Kerala'],
  },
  {
    name: 'Navratri',
    date: '2026-10-09',
    type: 'religious',
    impact: 'high',
    description: '9-night festival, fasting foods, gifts',
    regions: ['West India', 'North India', 'East India'],
  },
  {
    name: 'Dussehra',
    date: '2026-10-18',
    type: 'religious',
    impact: 'high',
    description: 'Vijayadashami, new beginnings, major shopping',
    regions: ['All India'],
  },
    {
    name: 'Diwali',
    date: '2026-11-01',
    type: 'religious',
    impact: 'high',
    description: 'Festival of lights, massive shopping, sweets, gifts, fireworks',
    regions: ['All India'],
  },
  {
    name: 'Guru Nanak Jayanti',
    date: '2026-11-15',
    type: 'religious',
    impact: 'medium',
    description: 'Sikh festival',
    regions: ['Punjab', 'North India'],
  },
  {
    name: 'Christmas',
    date: '2026-12-25',
    type: 'religious',
    impact: 'high',
    description: 'Celebrations in metro cities and Christian areas',
    regions: ['Metro cities', 'Kerala', 'Goa', 'Northeast'],
  },
];

const SEASONAL_FACTORS: SeasonalFactor[] = [
  {
    name: 'Summer Season',
    type: 'season',
    impact: 'positive',
    description: 'High demand for beverages, ice creams, coolers',
    regions: ['All India'],
  },
  {
    name: 'Monsoon Season',
    type: 'season',
    impact: 'positive',
    description: 'High demand for snacks, hot beverages, umbrella, raincoats',
    regions: ['All India'],
  },
  {
    name: 'Winter Season',
    type: 'season',
    impact: 'positive',
    description: 'High demand for winter foods, blankets, heaters',
    regions: ['North India', 'Hill stations'],
  },
  {
    name: 'Post-Monsoon Harvest',
    type: 'season',
    impact: 'positive',
    description: 'Better purchasing power in rural areas',
    regions: ['Rural India', 'Agricultural regions'],
  },
  {
    name: 'Exam Season',
    type: 'event',
    impact: 'negative',
    description: 'Reduced footfall, focus on study materials',
    regions: ['Metro cities', 'Student areas'],
  },
  {
    name: 'Wedding Season',
    type: 'event',
    impact: 'positive',
    description: 'High demand for gifts, sweets, packaged foods',
    regions: ['All India', 'Peak in Oct-Nov'],
  },
  {
    name: 'School Vacation',
    type: 'event',
    impact: 'positive',
    description: 'High consumption of snacks, beverages',
    regions: ['All India'],
  },
];

function getCurrentSeason(): SeasonalFactor | null {
  const month = new Date().getMonth();
  
  if (month >= 3 && month <= 5) {
    return SEASONAL_FACTORS.find(f => f.name === 'Summer Season') || null;
  } else if (month >= 6 && month <= 8) {
    return SEASONAL_FACTORS.find(f => f.name === 'Monsoon Season') || null;
  } else if (month >= 9 && month <= 10) {
    return SEASONAL_FACTORS.find(f => f.name === 'Wedding Season') || null;
  } else if (month >= 11 || month <= 1) {
    return SEASONAL_FACTORS.find(f => f.name === 'Winter Season') || null;
  }
  
  return SEASONAL_FACTORS.find(f => f.name === 'Post-Monsoon Harvest') || null;
}

function getUpcomingFestivals(daysAhead: number = 60): Festival[] {
  const today = new Date();
  const festivals: Festival[] = [];
  
  for (const festival of INDIAN_FESTIVALS_2026) {
    const festivalDate = new Date(festival.date);
    const daysUntil = Math.ceil((festivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil >= 0 && daysUntil <= daysAhead) {
      festivals.push({
        ...festival,
        date: festivalDate.toISOString().split('T')[0],
      });
    }
  }
  
  return festivals.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

class FestivalsClient {
  private cache: { data: FestivalData; timestamp: number } | null = null;
  private cacheTimeout: number = 24 * 60 * 60 * 1000;

  constructor() {
    console.log('[Festivals] Client initialized');
  }

  async getFestivals(): Promise<FestivalData> {
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheTimeout) {
      console.log('[Festivals] Returning cached data');
      return this.cache.data;
    }

    console.log('[Festivals] Fetching festival data');
    
    const upcomingFestivals = getUpcomingFestivals(60);
    const currentSeason = getCurrentSeason();
    
    const seasonalFactors = SEASONAL_FACTORS.filter(f => {
      if (f.type === 'season' && currentSeason && f.name === currentSeason.name) {
        return true;
      }
      return f.type === 'event' || f.type === 'weather';
    });

    if (!seasonalFactors.includes(currentSeason!)) {
      if (currentSeason) {
        seasonalFactors.unshift(currentSeason);
      }
    }

    const data: FestivalData = {
      festivals: upcomingFestivals,
      seasonal_factors: seasonalFactors,
      fetched_at: new Date().toISOString(),
    };

    this.cache = { data, timestamp: Date.now() };
    
    console.log('[Festivals] Found', upcomingFestivals.length, 'upcoming festivals');
    return data;
  }

  getFestivalImpact(festivalName: string): 'high' | 'medium' | 'low' | null {
    const festival = INDIAN_FESTIVALS_2026.find(
      f => f.name.toLowerCase() === festivalName.toLowerCase()
    );
    return festival?.impact || null;
  }
}

export const festivalsClient = new FestivalsClient();
export default festivalsClient;
