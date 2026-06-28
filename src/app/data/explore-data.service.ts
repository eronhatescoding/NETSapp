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
  /**
   * Score events using DNA affinity vector + namespace proximity + baseline
   */
  private scoreEvents(events: Event[], dna: any): Event[] {
    if (!dna || !dna.affinityVector || dna.affinityVector.length === 0) {
      return events.map(event => ({ 
        ...event, 
        dnaMatch: 12, 
        matchReason: 'Complete a few transactions to get personalized scores' 
      }));
    }

    const affinityMap = new Map<string, number>();
    const namespaceMax = new Map<string, number>();
    dna.affinityVector.forEach((a: any) => {
      affinityMap.set(a.tag, a.weight);
      const ns = a.tag.split(':')[0];
      const current = namespaceMax.get(ns) || 0;
      if (a.weight > current) namespaceMax.set(ns, a.weight);
    });

    return events.map(event => {
      const exactMatches: { tag: string; weight: number }[] = [];
      const proxMatches: { tag: string; weight: number }[] = [];
      let unmatchedCount = 0;

      event.tags.forEach(tag => {
        const exact = affinityMap.get(tag);
        if (exact) {
          exactMatches.push({ tag, weight: exact });
          return;
        }
        
        const ns = tag.split(':')[0];
        const nsBest = namespaceMax.get(ns);
        if (nsBest) {
          proxMatches.push({ tag, weight: nsBest * 0.3 });
          return;
        }
        
        unmatchedCount++;
      });

      const exactSum = exactMatches.reduce((s, m) => s + m.weight, 0);
      const proxSum = proxMatches.reduce((s, m) => s + m.weight, 0);

      // ═══ Core Formula: Weighted Average with Decay ═══
      // Exact matches at full weight, proximity at half weight
      const numerator = exactSum + (proxSum * 0.5);
      // Unmatched tags create drag; small smoothing constant prevents division by zero
      const denominator = numerator + (unmatchedCount * 0.18) + 0.15;
      let baseScore = (numerator / denominator) * 85;

      // Coverage bonus: rewards events where a higher % of tags align
      const exactCoverage = exactMatches.length / event.tags.length;
      const proxCoverage = proxMatches.length / event.tags.length;
      const coverageBonus = (exactCoverage * 10) + (proxCoverage * 4);

      // Streak bonus: 2+ exact matches = stronger confidence signal
      const streakBonus = exactMatches.length >= 3 ? 8 : exactMatches.length >= 2 ? 4 : 0;

      let score = Math.round(baseScore + coverageBonus + streakBonus);

      // Soft bounds — no hard cliff
      if (score > 100) score = 100;
      if (score > 0 && score < 8) score = 8;
      if (score === 0) score = 5;

      const reason = this.buildMatchReason(
        exactMatches.map(m => m.tag),
        proxMatches.map(m => m.tag),
        dna,
        event,
        score
      );

      return { ...event, dnaMatch: score, matchReason: reason };
    }).sort((a, b) => (b.dnaMatch || 0) - (a.dnaMatch || 0));
  }

  private scoreActivities(activities: Activity[], dna: any): Activity[] {
    if (!dna || !dna.affinityVector || dna.affinityVector.length === 0) {
      return activities.map(activity => ({ 
        ...activity, 
        dnaMatch: 12, 
        matchReason: 'Complete a few transactions to get personalized scores' 
      }));
    }

    const affinityMap = new Map<string, number>();
    const namespaceMax = new Map<string, number>();
    dna.affinityVector.forEach((a: any) => {
      affinityMap.set(a.tag, a.weight);
      const ns = a.tag.split(':')[0];
      const current = namespaceMax.get(ns) || 0;
      if (a.weight > current) namespaceMax.set(ns, a.weight);
    });

    const topMerchantIds = new Set((dna.topMerchants || []).map((m: any) => m.id));

    return activities.map(activity => {
      const exactMatches: { tag: string; weight: number }[] = [];
      const proxMatches: { tag: string; weight: number }[] = [];
      let unmatchedCount = 0;

      activity.tags.forEach(tag => {
        const exact = affinityMap.get(tag);
        if (exact) {
          exactMatches.push({ tag, weight: exact });
          return;
        }
        
        const ns = tag.split(':')[0];
        const nsBest = namespaceMax.get(ns);
        if (nsBest) {
          proxMatches.push({ tag, weight: nsBest * 0.3 });
          return;
        }
        
        unmatchedCount++;
      });

      const exactSum = exactMatches.reduce((s, m) => s + m.weight, 0);
      const proxSum = proxMatches.reduce((s, m) => s + m.weight, 0);

      const numerator = exactSum + (proxSum * 0.5);
      const denominator = numerator + (unmatchedCount * 0.18) + 0.15;
      let baseScore = (numerator / denominator) * 85;

      const exactCoverage = exactMatches.length / activity.tags.length;
      const proxCoverage = proxMatches.length / activity.tags.length;
      const coverageBonus = (exactCoverage * 10) + (proxCoverage * 4);

      const streakBonus = exactMatches.length >= 3 ? 8 : exactMatches.length >= 2 ? 4 : 0;

      let score = Math.round(baseScore + coverageBonus + streakBonus);

      // Novelty penalty: slightly gentler (0.82 vs old 0.7) to preserve mid-range scores
      if (activity.merchantId && topMerchantIds.has(activity.merchantId)) {
        score = Math.round(score * 0.82);
      }

      if (score > 100) score = 100;
      if (score > 0 && score < 8) score = 8;
      if (score === 0) score = 5;

      const reason = this.buildMatchReason(
        exactMatches.map(m => m.tag),
        proxMatches.map(m => m.tag),
        dna,
        activity,
        score
      );

      return { ...activity, dnaMatch: score, matchReason: reason };
    }).sort((a, b) => (b.dnaMatch || 0) - (a.dnaMatch || 0));
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
  private buildMatchReason(
    exactTags: string[],
    proxTags: string[],
    dna: any,
    item: any,
    score: number
  ): string {
    if (exactTags.length === 0 && proxTags.length === 0) {
      if (score <= 15) return 'New discovery — explore outside your usual spots';
      return 'Explore something new based on your spending patterns';
    }

    if (exactTags.length > 0) {
      const topTag = exactTags[0];
      const tagParts = topTag.split(':');
      const namespace = tagParts[0];
      const subtag = tagParts[1];

      const friendlyNames: Record<string, Record<string, string>> = {
        fnb: {
          bubbletea: 'bubble tea', coffee: 'coffee', cafe: 'cafes', hawker: 'hawker food',
          korean: 'Korean food', bbq: 'BBQ', buffet: 'buffets', local: 'local food',
          foodfestival: 'food festivals', workshop: 'workshops'
        },
        fit: {
          gym: 'the gym', fitness: 'fitness', sports: 'sports', nature: 'nature', routine: 'routines'
        },
        ent: {
          liveevents: 'live events', kpop: 'K-pop', music: 'live music', comedy: 'comedy',
          clubbing: 'clubbing', nightlife: 'nightlife', art: 'art', digital: 'digital art',
          interactive: 'interactive art'
        }
      };

      const friendly = friendlyNames[namespace]?.[subtag] || subtag;
      return `Because you love ${friendly}`;
    }

    // Proximity-only match
    const topProx = proxTags[0];
    const ns = topProx.split(':')[0];
    const nsFriendly: Record<string, string> = {
      fnb: 'food & drink', fit: 'fitness', ent: 'entertainment',
      shop: 'shopping', trav: 'travel'
    };
    return `You enjoy ${nsFriendly[ns] || ns} — this could be your vibe`;
  }

  getTasteColor(match: number): string {
    if (match >= 85) return 'success';
    if (match >= 65) return 'primary';
    if (match >= 40) return 'warning';
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
