import { Injectable } from '@angular/core';
import { Event, Activity } from '../models/explore.model';
import { UserDnaService } from './user-dna.service';
import { TicketmasterApiService } from './ticketmaster-api.service';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, shareReplay, switchMap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ExploreDataService {

  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();

  private eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$: Observable<Event[]> = this.eventsSubject.asObservable();

  public scoredEvents$: Observable<Event[]>;
  public scoredActivities$: Observable<Activity[]>;

  // Hardcoded activities (local recommendations)
  private activities: Activity[] = [
    {
      id: 'a1', title: 'PPP Coffee Roasters Workshop', category: 'Workshop',
      description: 'Learn latte art from champion baristas.',
      location: 'Star Vista', distance: '0.8km', estimatedCost: 45,
      tags: ['fnb:coffee', 'fnb:cafe', 'fnb:workshop'],
      weatherSuitable: ['any'], isIndoor: true, timeOfDay: 'morning',
      merchantId: 'ppp-coffee'
    },
    {
      id: 'a2', title: 'ActiveSG Gym Pass', category: 'Fitness',
      description: 'Unlimited gym access at Clementi Stadium.',
      location: 'Clementi Stadium', distance: '0.5km', estimatedCost: 25,
      tags: ['fit:gym', 'fit:fitness', 'fit:routine'],
      weatherSuitable: ['any'], isIndoor: true, timeOfDay: 'afternoon',
      merchantId: 'activesg'
    },
    {
      id: 'a3', title: 'Hawker Heritage Walk', category: 'Cultural',
      description: 'Guided tour of Clementi 448 Market with tastings.',
      location: 'Clementi 448', distance: '0.3km', estimatedCost: 15,
      tags: ['fnb:hawker', 'fnb:local', 'fnb:food'],
      weatherSuitable: ['sunny', 'cloudy', 'any'], isIndoor: false, timeOfDay: 'morning',
      merchantId: 'hawker-heritage'
    },
    {
      id: 'a4', title: 'Seoul Yummy K-BBQ Experience', category: 'Dining',
      description: 'All-you-can-eat Korean BBQ with banchan buffet.',
      location: 'JEM', distance: '2.5km', estimatedCost: 28,
      tags: ['fnb:korean', 'fnb:bbq', 'fnb:buffet'],
      weatherSuitable: ['any'], isIndoor: true, timeOfDay: 'evening',
      merchantId: 'seoul-yummy'
    },
    {
      id: 'a5', title: 'Zouk Singapore: Saturday Night', category: 'Nightlife',
      description: "Asia's iconic nightclub. Saturday entry with 2 drinks.",
      location: 'Clarke Quay', distance: '6km', estimatedCost: 45,
      tags: ['ent:clubbing', 'ent:nightlife', 'ent:music'],
      weatherSuitable: ['any'], isIndoor: true, timeOfDay: 'evening',
      merchantId: 'zouk'
    }
  ];

  constructor(
    private userDnaService: UserDnaService,
    private ticketmasterApi: TicketmasterApiService
  ) {
    // Load events from Ticketmaster on service init
    this.loadEvents();

    // Score events with live DNA
    this.scoredEvents$ = combineLatest([
      this.events$,
      this.userDnaService.dna$
    ]).pipe(
      map(([events, dna]) => this.scoreEvents(events, dna)),
      shareReplay(1)
    );

    // Score activities with live DNA
    this.scoredActivities$ = combineLatest([
      of(this.activities),
      this.userDnaService.dna$
    ]).pipe(
      map(([activities, dna]) => this.scoreActivities(activities, dna)),
      shareReplay(1)
    );
  }

  private async loadEvents(): Promise<void> {
    this.loadingSubject.next(true);
    const events = await this.ticketmasterApi.getSingaporeEvents();
    this.eventsSubject.next(events);
    this.loadingSubject.next(false);
  }

  /**
   * Score events using DNA affinity vector
   */
  private scoreEvents(events: Event[], dna: any): Event[] {
    if (!dna || !dna.affinityVector || dna.affinityVector.length === 0) {
      return events.map(event => ({ 
        ...event, 
        dnaMatch: 0, 
        matchReason: 'Complete a few transactions to get personalized scores' 
      }));
    }

    const affinityMap = new Map<string, number>();
    dna.affinityVector.forEach((a: any) => affinityMap.set(a.tag, a.weight));

    return events.map(event => {
      let rawScore = 0;
      const matchedTags: string[] = [];
      let maxWeight = 0;

      event.tags.forEach(tag => {
        const weight = affinityMap.get(tag);
        if (weight) {
          rawScore += weight;
          matchedTags.push(tag);
          if (weight > maxWeight) maxWeight = weight;
        }
      });

      // Base score: strongest single match * 100 (0.3 → 30%, 0.8 → 80%)
      let dnaScore = Math.round(maxWeight * 100);
      
      // Bonus: +10% for each additional matching tag (up to +30%)
      const tagBonus = Math.min((matchedTags.length - 1) * 10, 30);
      dnaScore = Math.min(dnaScore + tagBonus, 100);

      const reason = this.buildMatchReason(matchedTags, dna, event, false);

      return {
        ...event,
        dnaMatch: dnaScore,
        matchReason: reason
      };
    }).sort((a, b) => (b.dnaMatch || 0) - (a.dnaMatch || 0));
  }

  /**
   * Score activities with novelty filter
   */
  private scoreActivities(activities: Activity[], dna: any): Activity[] {
    if (!dna || !dna.affinityVector || dna.affinityVector.length === 0) {
      return activities.map(activity => ({ 
        ...activity, 
        dnaMatch: 0, 
        matchReason: 'Complete a few transactions to get personalized scores' 
      }));
    }

    const affinityMap = new Map<string, number>();
    dna.affinityVector.forEach((a: any) => affinityMap.set(a.tag, a.weight));

    const topMerchantIds = new Set((dna.topMerchants || []).map((m: any) => m.id));

    return activities.map(activity => {
      let rawScore = 0;
      const matchedTags: string[] = [];

      activity.tags.forEach(tag => {
        const weight = affinityMap.get(tag);
        if (weight) {
          rawScore += weight;
          matchedTags.push(tag);
        }
      });

      let dnaScore = Math.min(Math.round(rawScore * 33), 100);

      // Novelty penalty
      let noveltyMultiplier = 1.0;
      if (activity.merchantId && topMerchantIds.has(activity.merchantId)) {
        noveltyMultiplier = 0.7;
      }

      const finalScore = Math.round(dnaScore * noveltyMultiplier);
      const reason = this.buildMatchReason(matchedTags, dna, activity, noveltyMultiplier < 1.0);

      return {
        ...activity,
        dnaMatch: finalScore,
        matchReason: reason
      };
    }).sort((a, b) => (b.dnaMatch || 0) - (a.dnaMatch || 0));
  }

  private buildMatchReason(matchedTags: string[], dna: any, item: any, isFamiliar: boolean): string {
    if (matchedTags.length === 0) {
      return 'Explore something new based on your spending patterns';
    }

    const topTag = matchedTags[0];
    const tagParts = topTag.split(':');
    const namespace = tagParts[0];
    const subtag = tagParts[1];

    const friendlyNames: Record<string, Record<string, string>> = {
      fnb: {
        bubbletea: 'bubble tea', coffee: 'coffee', cafe: 'cafes', hawker: 'hawker food',
        korean: 'Korean food', bbq: 'BBQ', buffet: 'buffets', local: 'local food',
        foodfestival: 'food festivals'
      },
      fit: {
        gym: 'the gym', fitness: 'fitness', sports: 'sports', nature: 'nature'
      },
      ent: {
        liveevents: 'live events', kpop: 'K-pop', music: 'live music', comedy: 'comedy',
        clubbing: 'clubbing', nightlife: 'nightlife', art: 'art', digital: 'digital art'
    }
  };

    const friendly = friendlyNames[namespace]?.[subtag] || subtag;

    if (isFamiliar) {
      return `You love ${friendly} — here's a fresh take on it`;
    }

    return `Because you love ${friendly}`;
  }

  applyWeatherFilter(activities: Activity[], weather: string): Activity[] {
    const currentWeather = weather.toLowerCase();
    return activities.map(activity => {
      const isSuitable = activity.weatherSuitable.includes('any') || 
                         activity.weatherSuitable.includes(currentWeather);
      const weatherMultiplier = isSuitable ? 1.0 : 0.3;
      return {
        ...activity,
        dnaMatch: Math.round((activity.dnaMatch || 0) * weatherMultiplier),
        weatherMultiplier
      };
    }).sort((a, b) => (b.dnaMatch || 0) - (a.dnaMatch || 0));
  }

  getTasteColor(match: number): string {
    if (match >= 85) return 'success';
    if (match >= 70) return 'primary';
    if (match >= 55) return 'warning';
    return 'medium';
  }

  // Refresh events (call if needed)
  refreshEvents(): void {
    this.loadEvents();
  }
    getActivityById(id: string): Activity | undefined {
    return this.activities.find(a => a.id === id);
  }
}
