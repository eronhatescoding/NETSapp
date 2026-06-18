export interface Transaction {
  id: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  subcategory?: string;
  description: string;
  merchant?: string;
  location?: string;
  paymentMethod?: string;
  weatherCondition?: 'sunny' | 'rainy' | 'cloudy' | 'stormy';
}

export interface SpendingPattern {
  category: string;
  subcategory?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'occasional';
  typicalDays: number[];        // 0=Sun, 1=Mon, ..., 6=Sat
  typicalTimeRange: string;     // e.g. "08:00-10:00"
  typicalAmount: number;
  typicalAmountRange: [number, number];
  confidence: number;           // 0-100
  lastOccurrence: string;       // YYYY-MM-DD
  streakCount: number;          // consecutive occurrences
  weatherPreference?: 'any' | 'dry' | 'indoor' | 'outdoor';
}

export interface WeeklyPattern {
  dayOfWeek: number;            // 0-6
  dayName: string;
  commonActivities: {
    category: string;
    subcategory?: string;
    time: string;
    amount: number;
    confidence: number;
    occurrences: number;
  }[];
  totalSpent: number;
  transactionCount: number;
}

export interface WeatherForecast {
  condition: 'sunny' | 'rainy' | 'cloudy' | 'stormy';
  temperature: number;          // celsius
  humidity: number;             // %
  rainChance: number;           // %
  description: string;
  indoorRecommended: boolean;
}

export interface PredictedActivity {
  time: string;
  category: string;
  subcategory?: string;
  description: string;
  estimatedCost: number;
  confidence: number;           // 0-100
  reason: string;
  weatherNote?: string;
  alternatives: Alternative[];
  isFromPattern: boolean;       // true = derived from historical pattern
}

export interface Alternative {
  description: string;
  estimatedCost: number;
  savings: number;
  reason: string;
  weatherSuitable: boolean;
}
