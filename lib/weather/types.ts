export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  visibility: number;
  condition: WeatherCondition;
  sunrise: number;
  sunset: number;
  timestamp: number;
}

export interface ForecastDay {
  date: string;
  temp_min: number;
  temp_max: number;
  humidity: number;
  wind_speed: number;
  condition: WeatherCondition;
  rainfall_mm: number;
  pop: number;
}

export interface WeatherData {
  pin_code: string;
  location: string;
  current: CurrentWeather | null;
  forecast: ForecastDay[];
}

export interface WeatherError {
  code: string;
  message: string;
}
