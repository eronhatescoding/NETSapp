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
  // DNA extensions — optional so existing hardcoded transactions still typecheck
  tags?: string[];
  merchantId?: string;
  userId?: string;
  isPlanned?: boolean;
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

// ─────────────────────────────────────────────────────────────
// CALVIN'S DNA EXTENSIONS — do not modify existing types above
// ─────────────────────────────────────────────────────────────

export type Category =
  | 'Food & Beverage'
  | 'Shopping'
  | 'Entertainment'
  | 'Education'
  | 'Fitness'
  | 'Transport'
  | 'Lifestyle & Services'
  | 'Income';

export interface Merchant {
  id: string;
  name: string;
  category: Category;
  tags: string[];       // namespaced: "fnb:bubbletea", "shopping:fashion"
  typicalAmount: number;
  icon?: string;        // ionicon name
}

export interface TagAffinity {
  tag: string;
  weight: number;       // 0..1 normalised
  count: number;        // number of transactions carrying this tag
  totalSpend: number;
  lastSeen: string;     // ISO date string (YYYY-MM-DD)
}

export interface Persona {
  id: string;
  name: string;         // e.g. "Bubble Tea Royalty"
  emoji: string;
  description: string;  // one-line copy shown on the Wrapped card
  color: string;        // hex — used as card accent
  triggerTags: string[]; // tags that activate this persona (top-N match)
  // FUTURE: behaviouralType?: 'decision-maker' | 'loyal' | 'actively-buying'
  //         Add when behavioural-persona layer is implemented.
}

export interface UserDNA {
  userId: string;
  generatedAt: string;  // ISO date string
  totals: {
    spent: number;
    income: number;
    txnCount: number;
  };
  categoryBreakdown: {
    category: Category;
    amount: number;
    pct: number;
  }[];
  topMerchants: {
    merchantId: string;
    name: string;
    count: number;
    spend: number;
  }[];
  affinityVector: TagAffinity[];  // Eron consumes this
  personas: Persona[];            // drives the Wrapped
}
