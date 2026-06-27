export interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  venue: string;
  description: string;
  price: number;
  tags: string[];           // Calvin's namespace:subtag format, e.g. ['ent:liveevents']
  isFeatured: boolean;
  imageUrl?: string;
  dnaMatch?: number;      // Live score 0-100
  matchReason?: string;    // "Because you love K-pop concerts"
  weatherMultiplier?: number;
}

export interface Activity {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  distance: string;
  estimatedCost: number;
  tags: string[];           // Calvin's namespace:subtag format
  weatherSuitable: string[];
  isIndoor: boolean;
  timeOfDay: string;
  merchantId?: string;       // Links to Calvin's merchant catalogue for novelty filtering
  dnaMatch?: number;        // Live score 0-100
  matchReason?: string;     // "Because you love bubble tea"
  weatherMultiplier?: number;
}
