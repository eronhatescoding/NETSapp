export interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  venue: string;
  description: string;
  price: number;
  tags: string[];
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  distance: string;
  estimatedCost: number;
  tasteMatch: number;
  tags: string[];
  weatherSuitable: ('sunny' | 'rainy' | 'cloudy' | 'any')[];
  isIndoor: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
}
