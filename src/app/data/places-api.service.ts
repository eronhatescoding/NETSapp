import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiKeysService } from './api-key.service';

export interface RealAlternative {
  name: string;
  address: string;
  distance: string;
  priceLevel: string;
  rating: number;
  isOpen: boolean;
  photoUrl?: string;
  source: 'google' | 'foursquare' | 'here' | 'tripadvisor' | 'mock';
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class PlacesApiService {

  constructor(
    private http: HttpClient,
    private apiKeys: ApiKeysService
  ) {}

  async getAlternatives(
    category: string,
    userLat: number = 1.3521,
    userLng: number = 103.8198
  ): Promise<RealAlternative[]> {
    
    const searchTerm = this.mapCategoryToSearch(category);
    
    // Priority: HERE → Foursquare → Mock
    // (Google removed — CORS issues in browser)
    
    if (this.apiKeys.hasHere) {
      try {
        const results = await this.queryHere(searchTerm, userLat, userLng);
        if (results.length > 0) return results;
      } catch (e) {
        console.warn('[Places] HERE failed:', e);
      }
    }
    
    console.log('[Places] Using mock data for:', category);
    return this.getMockAlternatives(category);
  }

  // ─── HERE Places API ─────────────────────────────────────
  private async queryHere(term: string, lat: number, lng: number): Promise<RealAlternative[]> {
    const url = `https://discover.search.hereapi.com/v1/discover` +
      `?apikey=${this.apiKeys.HERE_API_KEY}` +
      `&q=${encodeURIComponent(term)}` +
      `&at=${lat},${lng}` +
      `&radius=3000` +
      `&limit=5` +
      `&lang=en-US`;
    
    const response: any = await this.http.get(url).toPromise();
    
    return (response.items || []).map((place: any) => ({
      name: place.title,
      address: place.address?.label || 'Singapore',
      distance: place.distance ? `${(place.distance / 1000).toFixed(1)}km` : 'Nearby',
      priceLevel: this.inferPriceLevel(place.categories),
      rating: place.averageRating ? (place.averageRating / 2) : 4.0,
      isOpen: place.openingHours?.isOpen ?? true,
      photoUrl: place.media?.images?.items?.[0]?.href,
      source: 'here' as const,
      reason: `${place.categories?.[0]?.name || 'Local'} · HERE Maps`
    }));
  }

  // ─── Mock Fallback (Enhanced) ─────────────────────────────
  private getMockAlternatives(category: string): RealAlternative[] {
    const mocks: Record<string, RealAlternative[]> = {
      'gym': [
        { name: 'ActiveSG Gym Clementi', address: 'Clementi Stadium, 220 Clementi Ave 6', distance: '0.5km', priceLevel: '$', rating: 4.2, isOpen: true, source: 'mock', reason: 'Your usual Tuesday spot · $2/entry · Open 6am-10pm' },
        { name: 'Fitness First Jurong East', address: 'JEM, 50 Jurong Gateway Rd', distance: '2.1km', priceLevel: '$$$', rating: 4.5, isOpen: true, source: 'mock', reason: 'Premium option · $80/month · Pool & sauna' }
      ],
      'coffee': [
        { name: 'PPP Coffee Star Vista', address: 'The Star Vista, 1 Vista Exchange Green', distance: '0.8km', priceLevel: '$$', rating: 4.6, isOpen: true, source: 'mock', reason: 'Your DNA shows 14x coffee visits · $6.50 · Latte art classes' },
        { name: 'Huggs Coffee Clementi', address: 'Clementi MRT Station', distance: '0.3km', priceLevel: '$', rating: 4.0, isOpen: true, source: 'mock', reason: 'Closest option · $2.50 · Local kopi style' }
      ],
      'bubble tea': [
        { name: 'LiHO TEA Clementi 448', address: 'Clementi 448 Market', distance: '0.3km', priceLevel: '$', rating: 4.3, isOpen: true, source: 'mock', reason: 'Your go-to bubble tea · $5.50 · Brown Sugar series' },
        { name: 'KOI The Jurong East', address: 'JEM, 50 Jurong Gateway Rd', distance: '2.1km', priceLevel: '$$', rating: 4.5, isOpen: true, source: 'mock', reason: 'Golden Bubble specialty · $6.20' }
      ],
      'lunch': [
        { name: 'Clementi 448 Market & Food Centre', address: 'Blk 448 Clementi Ave 3', distance: '0.3km', priceLevel: '$', rating: 4.4, isOpen: true, source: 'mock', reason: '9x visits · $5.50 · Chicken Rice & Wanton Mee' },
        { name: 'West Coast Food Centre', address: '726 Clementi West St 2', distance: '1.2km', priceLevel: '$', rating: 4.2, isOpen: true, source: 'mock', reason: 'Famous Satay & BBQ Stingray · $8' }
      ],
      'dinner': [
        { name: 'Seoul Yummy JEM', address: 'JEM, 50 Jurong Gateway Rd #B1-10', distance: '2.5km', priceLevel: '$$', rating: 4.3, isOpen: true, source: 'mock', reason: 'Your Wednesday spot · $28 · All-you-can-eat K-BBQ' },
        { name: 'Eighteen Chefs Clementi', address: 'The Clementi Mall, 3155 Commonwealth Ave W', distance: '0.6km', priceLevel: '$$', rating: 4.1, isOpen: true, source: 'mock', reason: 'Student-friendly · $15 · Heart Attack Fried Rice' }
      ],
      'korean': [
        { name: 'Seoul Yummy JEM', address: 'JEM, 50 Jurong Gateway Rd #B1-10', distance: '2.5km', priceLevel: '$$', rating: 4.3, isOpen: true, source: 'mock', reason: 'Your Wednesday spot · $28 · All-you-can-eat K-BBQ' },
        { name: 'Nanta BBQ Star Vista', address: 'The Star Vista, 1 Vista Exchange Green', distance: '0.8km', priceLevel: '$$$', rating: 4.5, isOpen: true, source: 'mock', reason: 'Premium Korean BBQ · $45 · Wagyu options' }
      ],
      'bbq': [
        { name: 'Seoul Yummy JEM', address: 'JEM, 50 Jurong Gateway Rd #B1-10', distance: '2.5km', priceLevel: '$$', rating: 4.3, isOpen: true, source: 'mock', reason: 'Your Wednesday spot · $28 · All-you-can-eat K-BBQ' },
        { name: 'Lau Pa Sat', address: '18 Raffles Quay', distance: '8km', priceLevel: '$$', rating: 4.4, isOpen: true, source: 'mock', reason: 'Satay Street · $15 · 7pm-3am' }
      ],
      'movies': [
        { name: 'Golden Village Jurong Point', address: 'Jurong Point, 1 Jurong West Central 2', distance: '3.2km', priceLevel: '$$', rating: 4.2, isOpen: true, source: 'mock', reason: 'GV Max · $14 · Dolby Atmos' },
        { name: 'Cathay Cineplexes Clementi', address: 'The Clementi Mall, 3155 Commonwealth Ave W', distance: '0.6km', priceLevel: '$', rating: 4.0, isOpen: true, source: 'mock', reason: 'Tuesday $7 movie · $7 · Student deals' }
      ],
      'clubbing': [
        { name: 'Zouk Singapore', address: '3C River Valley Rd, Clarke Quay', distance: '6km', priceLevel: '$$$', rating: 4.5, isOpen: true, source: 'mock', reason: 'Asia\'s #1 club · $45 · Saturday entry + 2 drinks' },
        { name: 'Marquee Singapore', address: 'Marina Bay Sands, 2 Bayfront Ave', distance: '7km', priceLevel: '$$$$', rating: 4.6, isOpen: true, source: 'mock', reason: 'Ferris wheel inside · $80 · International DJs' }
      ]
    };
    
    return mocks[category.toLowerCase()] || [
      { name: 'Local Favorite', address: 'Singapore', distance: '1km', priceLevel: '$$', rating: 4.0, isOpen: true, source: 'mock', reason: 'Based on your spending DNA' }
    ];
  }

  // ─── Helpers ─────────────────────────────────────────────
  private mapCategoryToSearch(category: string): string {
    const map: Record<string, string> = {
      'gym': 'gym fitness',
      'sports': 'sports centre',
      'coffee': 'coffee cafe',
      'bubble tea': 'bubble tea',
      'lunch': 'restaurant',
      'dinner': 'restaurant',
      'korean': 'korean restaurant',
      'bbq': 'bbq restaurant',
      'movies': 'cinema',
      'clubbing': 'nightclub'
    };
    return map[category.toLowerCase()] || category;
  }

  private inferPriceLevel(categories: any[]): string {
    if (!categories) return '$$';
    const name = categories[0]?.name?.toLowerCase() || '';
    if (name.includes('fast food') || name.includes('hawker')) return '$';
    if (name.includes('fine dining') || name.includes('luxury')) return '$$$$';
    if (name.includes('restaurant')) return '$$$';
    return '$$';
  }
}