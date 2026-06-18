import { WeatherForecast } from './transaction.model';

export interface DayPlan {
  date: string;
  dayOfWeek: number;
  dayName: string;
  weather: WeatherForecast;
  activities: PlannedActivity[];
  totalEstimatedCost: number;
  totalPotentialSavings: number;
  patternMatchScore: number;    // 0-100 how well this matches historical patterns
  aiSummary: string;
  weeklyTrend: {
    label: string;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  detectedPatterns: string[];
}

export interface PlannedActivity {
  id: string;
  time: string;
  endTime?: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  estimatedCost: number;
  confidence: number;
  reason: string;
  patternSource: 'daily_streak' | 'weekly_pattern' | 'weather_adapted' | 'trending' | 'fallback';
  weatherNote?: string;
  alternatives: PlannedAlternative[];
  icon: string;
  color: string;
}

export interface PlannedAlternative {
  title: string;
  description: string;
  estimatedCost: number;
  savings: number;
  reason: string;
  weatherSuitable: boolean;
  distance?: string;
}
