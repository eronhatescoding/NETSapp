import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Event } from '../models/explore.model';

@Injectable({ providedIn: 'root' })
export class TicketmasterApiService {
  // ═══════════════════════════════════════════════════════════
  // SWAP YOUR API KEY HERE
  // ═══════════════════════════════════════════════════════════
  private readonly API_KEY = 'ZLAOD2zjsYdeuXFC2bcUwmKUBNfxHdhG';
  private readonly BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
  
  private cache: Event[] | null = null;

  constructor(private http: HttpClient) {}

  async getSingaporeEvents(): Promise<Event[]> {
    // Session cache — fetch once per app session
    if (this.cache) return this.cache;

    try {
      const response: any = await this.http.get(
        `${this.BASE_URL}/events.json?apikey=${this.API_KEY}&countryCode=SG&size=50&sort=date,asc`
      ).toPromise();

      this.cache = this.mapToEvents(response?._embedded?.events || []);
      return this.cache;
    } catch (err) {
      console.warn('[Ticketmaster] API failed, falling back to mock:', err);
      // Fallback to mock if API fails
      this.cache = this.getMockEvents();
      return this.cache;
    }
  }

  private mapToEvents(apiEvents: any[]): Event[] {
    return apiEvents.map((e, idx) => ({
      id: e.id || `tm-${idx}`,
      title: e.name || 'Unknown Event',
      category: this.mapCategory(e.classifications),
      date: this.formatDate(e.dates?.start?.dateTime || e.dates?.start?.localDate),
      venue: e._embedded?.venues?.[0]?.name || 'Singapore',
      description: e.description || e.info || 'No description available.',
      price: this.extractPrice(e.priceRanges),
      tags: this.extractTags(e.classifications, e.name),
      isFeatured: idx === 0, // Top result featured
      imageUrl: e.images?.[0]?.url || null
    }));
  }

  private mapCategory(classifications: any[]): string {
    if (!classifications?.length) return 'Entertainment';
    const seg = classifications[0]?.segment?.name;
    const genre = classifications[0]?.genre?.name;
    if (seg === 'Music') return 'Concert';
    if (seg === 'Sports') return 'Sports';
    if (genre === 'Comedy') return 'Comedy';
    if (genre === 'Food') return 'Food & Drink';
    return 'Entertainment';
  }

  private extractPrice(ranges: any[]): number {
    if (!ranges?.length) return 0;
    return Math.round(ranges[0].min || 0);
  }

  private extractTags(classifications: any[], name: string): string[] {
    const tags: string[] = ['ent:liveevents'];
    const seg = classifications?.[0]?.segment?.name?.toLowerCase();
    const genre = classifications?.[0]?.genre?.name?.toLowerCase();
    
    if (seg === 'music') tags.push('ent:music');
    if (name.toLowerCase().includes('k-pop') || name.toLowerCase().includes('kpop')) tags.push('ent:kpop');
    if (genre === 'comedy') tags.push('ent:comedy');
    if (genre === 'food') tags.push('fnb:foodfestival');
    if (seg === 'sports') tags.push('fit:sports');
    
    return tags;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    const dateNum = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    
    if (diffDays < 0) return `${dayName} ${dateNum} ${month} (Past)`;
    if (diffDays === 0) return `Today, ${dayName} ${dateNum} ${month}`;
    if (diffDays === 1) return `Tomorrow, ${dayName} ${dateNum} ${month}`;
    if (diffDays < 7) return `This ${dayName}, ${dateNum} ${month}`;
    if (diffDays < 14) return `Next ${dayName}, ${dateNum} ${month}`;
    return `${dayName} ${dateNum} ${month}`;
  }

  // Fallback mock events if API fails
  private getMockEvents(): Event[] {
    return [
      {
        id: 'mock-1', title: 'NMIXX CHANGE UP : MIXX LAB', category: 'Concert',
        date: 'This Saturday, 28 Jun', venue: 'Singapore Indoor Stadium',
        description: 'K-pop girl group NMIXX brings explosive energy to Singapore!',
        price: 168, tags: ['ent:liveevents', 'ent:kpop', 'ent:music'], isFeatured: true
      },
      {
        id: 'mock-2', title: 'Singapore Food Festival 2026', category: 'Festival',
        date: 'Next Tuesday, 1 Jul', venue: 'Various Locations',
        description: 'Month-long celebration of Singapore hawker culture.',
        price: 0, tags: ['fnb:foodfestival', 'fnb:hawker', 'fnb:local'], isFeatured: false
      },
      {
        id: 'mock-3', title: 'Future World: ArtScience Museum', category: 'Exhibition',
        date: 'Ongoing', venue: 'Marina Bay Sands',
        description: 'Immersive digital art installation by teamLab.',
        price: 18, tags: ['ent:interactive', 'ent:digital', 'ent:art'], isFeatured: false
      }
    ];
  }
}