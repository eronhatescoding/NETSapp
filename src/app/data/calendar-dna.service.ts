import { Injectable } from '@angular/core';
import { Observable, combineLatest, of, BehaviorSubject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { UserDnaService } from './user-dna.service';
import { Transaction, PredictedActivity, WeeklyPattern, SpendingPattern } from '../models/transaction.model';
// this is the latest
export interface DayPrediction {
  date: string;
  dayOfWeek: number;
  dayName: string;
  isPast: boolean;
  isToday: boolean;
  transactions: Transaction[];
  predictedActivities: PredictedActivity[];
  patternMatches: SpendingPattern[];
  totalPredictedSpend: number;
  confidence: number; // 0-100
  aiSummary: string;
}

@Injectable({ providedIn: 'root' })
export class CalendarDnaService {

  // 13-day weather forecast mock (replace with your actual weather service)
  private weatherForecast = new BehaviorSubject<Map<string, string>>(new Map());

  constructor(private userDnaService: UserDnaService) {}

  /**
   * Get predictions for a specific date
   * - Past/today: show actual transactions
   * - Future: predict based on DNA patterns + weather
   */
  getDayPrediction(dateStr: string): Observable<DayPrediction> {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();

    return combineLatest([
      of(dateStr),
      this.userDnaService.dna$,
      of(this.userDnaService.getTransactionsByDate(dateStr)),
      of(this.userDnaService.getWeeklyPattern(dayOfWeek)),
      of(this.userDnaService.detectPatterns()),
      this.weatherForecast
    ]).pipe(
      map(([ds, dna, transactions, weeklyPattern, allPatterns, weatherMap]) => {
        const weather = weatherMap.get(ds) || 'sunny';

        if (isPast || isToday) {
          // Past/today: show actual transactions
          return this.buildPastPrediction(ds, dayOfWeek, dayNames, isToday, transactions, allPatterns);
        } else {
          // Future: predict based on DNA
          return this.buildFuturePrediction(ds, dayOfWeek, dayNames, dna, weeklyPattern, allPatterns, weather);
        }
      }),
      shareReplay(1)
    );
  }

  private buildPastPrediction(
    dateStr: string, 
    dayOfWeek: number, 
    dayNames: string[], 
    isToday: boolean,
    transactions: Transaction[],
    allPatterns: SpendingPattern[]
  ): DayPrediction {
    // Find patterns that occurred on this date
    const matchingPatterns = allPatterns.filter(p => 
      p.typicalDays.includes(dayOfWeek) && 
      transactions.some(t => t.subcategory === p.subcategory)
    );

    const totalSpent = transactions
      .filter(t => t.type === 'debit')
      .reduce((s, t) => s + t.amount, 0);

    return {
      date: dateStr,
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      isPast: !isToday,
      isToday,
      transactions,
      predictedActivities: [],
      patternMatches: matchingPatterns,
      totalPredictedSpend: totalSpent,
      confidence: matchingPatterns.length > 0 ? Math.round(matchingPatterns.reduce((s, p) => s + p.confidence, 0) / matchingPatterns.length) : 0,
      aiSummary: this.generatePastSummary(transactions, matchingPatterns, isToday)
    };
  }

  private buildFuturePrediction(
    dateStr: string,
    dayOfWeek: number,
    dayNames: string[],
    dna: any,
    weeklyPattern: WeeklyPattern,
    allPatterns: SpendingPattern[],
    weather: string
  ): DayPrediction {
    const predictions: PredictedActivity[] = [];
    let totalPredicted = 0;
    let matchCount = 0;

    // 1. Use weekly pattern for this day
    if (weeklyPattern.commonActivities.length > 0) {
      weeklyPattern.commonActivities.slice(0, 3).forEach(activity => {
        const pattern = allPatterns.find(p => p.subcategory === activity.subcategory);
        const isWeatherOk = this.checkWeather(activity.category, activity.subcategory, weather);

        predictions.push({
          time: activity.time,
          category: activity.category,
          subcategory: activity.subcategory,
          description: this.getActivityDescription(activity.subcategory, activity.category),
          estimatedCost: activity.amount,
          confidence: activity.confidence,
          reason: `You usually ${activity.subcategory?.toLowerCase() || 'do this'} on ${dayNames[dayOfWeek]}s (${activity.occurrences}x)`,
          weatherNote: isWeatherOk ? undefined : `Consider indoor alternative — ${weather} expected`,
          alternatives: this.getAlternatives(activity, weather, dna),
          isFromPattern: true
        });

        totalPredicted += activity.amount;
        matchCount++;
      });
    }

    // 2. Use top DNA affinities to suggest new activities
    if (dna?.affinityVector && predictions.length < 3) {
      const topAffinities = dna.affinityVector.slice(0, 5);

      for (const affinity of topAffinities) {
        if (predictions.length >= 4) break;

        // Skip if already predicted
        const alreadyPredicted = predictions.some(p => 
          this.tagMatchesSubcategory(affinity.tag, p.subcategory || '')
        );
        if (alreadyPredicted) continue;

        const activity = this.affinityToActivity(affinity, dayOfWeek, weather);
        if (activity) {
          predictions.push(activity);
          totalPredicted += activity.estimatedCost;
          matchCount++;
        }
      }
    }

    // Sort by time
    predictions.sort((a, b) => a.time.localeCompare(b.time));

    // Find matching patterns for confidence
    const dayPatterns = allPatterns.filter(p => p.typicalDays.includes(dayOfWeek));
    const avgConfidence = dayPatterns.length > 0 
      ? Math.round(dayPatterns.reduce((s, p) => s + p.confidence, 0) / dayPatterns.length)
      : 50;

    return {
      date: dateStr,
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      isPast: false,
      isToday: false,
      transactions: [],
      predictedActivities: predictions,
      patternMatches: dayPatterns,
      totalPredictedSpend: Math.round(totalPredicted * 100) / 100,
      confidence: Math.min(avgConfidence + (matchCount * 5), 95),
      aiSummary: this.generateFutureSummary(dayNames[dayOfWeek], predictions, weather)
    };
  }

  private getActivityDescription(subcategory: string | undefined, category: string): string {
    const descriptions: Record<string, string> = {
      'Coffee': 'Morning coffee run',
      'Gym': 'Gym session',
      'Lunch': 'Lunch break',
      'Dinner': 'Dinner out',
      'Breakfast': 'Breakfast',
      'Brunch': 'Weekend brunch',
      'Movies': 'Movie night',
      'Bowling': 'Bowling with friends',
      'Park': 'Park visit',
      'Escape Room': 'Escape room adventure',
      'Museum': 'Museum visit',
      'Streaming': 'Netflix & chill',
      'Clothing': 'Shopping spree',
      'Groceries': 'Grocery run',
      'Skincare': 'Beauty shopping',
      'Stationery': 'Study supplies',
      'Books': 'Book shopping',
    };
    return descriptions[subcategory || ''] || `${category} activity`;
  }

  private tagMatchesSubcategory(tag: string, subcategory: string): boolean {
    const mappings: Record<string, string[]> = {
      'fnb:coffee': ['Coffee'],
      'fnb:gym': ['Gym'],
      'fnb:lunch': ['Lunch'],
      'fnb:dinner': ['Dinner'],
      'fnb:breakfast': ['Breakfast'],
      'fnb:brunch': ['Brunch'],
      'ent:cinema': ['Movies'],
      'ent:arcade': ['Bowling'],
      'fit:gym': ['Gym'],
      'fit:sports': ['Gym', 'Bowling'],
      'shopping:clothing': ['Clothing'],
      'shopping:groceries': ['Groceries'],
      'shopping:beauty': ['Skincare'],
      'edu:stationery': ['Stationery'],
      'edu:books': ['Books'],
    };
    const matches = mappings[tag] || [];
    return matches.includes(subcategory);
  }

  private affinityToActivity(affinity: any, dayOfWeek: number, weather: string): PredictedActivity | null {
    const tag = affinity.tag;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Map top affinity tags to activities
    const activityMap: Record<string, { category: string; subcategory: string; time: string; cost: number; desc: string }> = {
      'fnb:coffee': { category: 'Food & Beverage', subcategory: 'Coffee', time: '08:30', cost: 2.80, desc: 'Your daily coffee fix' },
      'fnb:bubbletea': { category: 'Food & Beverage', subcategory: 'Bubble Tea', time: '15:00', cost: 4.50, desc: 'Afternoon bubble tea treat' },
      'fnb:hawker': { category: 'Food & Beverage', subcategory: 'Lunch', time: '12:15', cost: 5.50, desc: 'Hawker food run' },
      'fnb:korean': { category: 'Food & Beverage', subcategory: 'Dinner', time: '19:00', cost: 22.00, desc: 'K-BBQ craving' },
      'fnb:japanese': { category: 'Food & Beverage', subcategory: 'Dinner', time: '19:30', cost: 20.00, desc: 'Sushi night' },
      'fnb:western': { category: 'Food & Beverage', subcategory: 'Dinner', time: '19:00', cost: 18.00, desc: 'Western dinner' },
      'fit:gym': { category: 'Fitness', subcategory: 'Gym', time: isWeekend ? '10:00' : '14:00', cost: 2.00, desc: 'Gym session' },
      'fit:sports': { category: 'Fitness', subcategory: 'Gym', time: isWeekend ? '10:00' : '14:00', cost: 2.00, desc: 'Sports activity' },
      'fit:cycling': { category: 'Fitness', subcategory: 'Cycling', time: '08:00', cost: 0, desc: 'Morning cycling' },
      'ent:cinema': { category: 'Entertainment', subcategory: 'Movies', time: '20:00', cost: 14.00, desc: 'Movie night' },
      'ent:clubbing': { category: 'Entertainment', subcategory: 'Clubbing', time: '23:00', cost: 45.00, desc: 'Saturday night out' },
      'shopping:groceries': { category: 'Shopping', subcategory: 'Groceries', time: isWeekend ? '10:00' : '19:00', cost: 35.00, desc: 'Grocery shopping' },
      'shopping:beauty': { category: 'Shopping', subcategory: 'Skincare', time: '14:00', cost: 30.00, desc: 'Beauty haul' },
      'shopping:fashion': { category: 'Shopping', subcategory: 'Clothing', time: '14:00', cost: 50.00, desc: 'Fashion shopping' },
      'edu:books': { category: 'Education', subcategory: 'Books', time: '11:00', cost: 25.00, desc: 'Book shopping' },
      'lst:subscription': { category: 'Lifestyle', subcategory: 'Streaming', time: '00:00', cost: 15.90, desc: 'Monthly subscription' },
    };

    const mapped = activityMap[tag];
    if (!mapped) return null;

    const isWeatherOk = this.checkWeather(mapped.category, mapped.subcategory, weather);

    return {
      time: mapped.time,
      category: mapped.category,
      subcategory: mapped.subcategory,
      description: mapped.desc,
      estimatedCost: mapped.cost,
      confidence: Math.round(affinity.weight * 90),
      reason: `Top DNA affinity: ${tag.split(':')[1]} (${Math.round(affinity.weight * 100)}% match)`,
      weatherNote: isWeatherOk ? undefined : `Not ideal for ${weather} — indoor alternative suggested`,
      alternatives: [],
      isFromPattern: false
    };
  }

  private checkWeather(category: string, subcategory: string | undefined, weather: string): boolean {
    if (weather === 'sunny' || weather === 'cloudy') return true;

    const indoorActivities = ['Coffee', 'Gym', 'Movies', 'Bowling', 'Escape Room', 'Museum', 'Streaming', 'Clothing', 'Groceries', 'Skincare', 'Stationery', 'Books', 'Restaurant', 'Dinner', 'Lunch', 'Breakfast', 'Brunch'];
    const outdoorActivities = ['Park', 'Cycling', 'Walking', 'Running'];

    if (weather === 'rainy' || weather === 'stormy') {
      if (outdoorActivities.includes(subcategory || '')) return false;
      return true; // indoor activities are fine
    }

    return true;
  }

  private getAlternatives(activity: any, weather: string, dna: any): any[] {
    const alts: any[] = [];

    // If outdoor activity and bad weather, suggest indoor alternative
    if ((weather === 'rainy' || weather === 'stormy') && 
        ['Park', 'Cycling', 'Walking'].includes(activity.subcategory)) {
      alts.push({
        description: 'Indoor gym session instead',
        estimatedCost: 2.00,
        savings: activity.amount - 2.00,
        reason: 'Rainy weather — stay dry indoors',
        weatherSuitable: true
      });
    }

    // If expensive, suggest cheaper DNA-matched alternative
    if (activity.amount > 20 && dna?.affinityVector) {
      const cheaperTag = dna.affinityVector.find((a: any) => {
        const cheapActivities = ['fnb:coffee', 'fnb:hawker', 'fit:gym'];
        return cheapActivities.includes(a.tag) && a.weight > 0.5;
      });
      if (cheaperTag) {
        alts.push({
          description: `${cheaperTag.tag.split(':')[1]} (your DNA favorite)`,
          estimatedCost: cheaperTag.tag.includes('gym') ? 2.00 : 5.50,
          savings: activity.amount - (cheaperTag.tag.includes('gym') ? 2.00 : 5.50),
          reason: 'Save money with a DNA-matched alternative',
          weatherSuitable: true
        });
      }
    }

    return alts;
  }

  private generatePastSummary(transactions: Transaction[], patterns: SpendingPattern[], isToday: boolean): string {
    if (transactions.length === 0) return isToday ? 'No transactions yet today' : 'No transactions';

    const total = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const topCategory = this.getTopCategory(transactions);

    if (isToday) {
      return `Spent $${total.toFixed(2)} today${topCategory ? `, mostly on ${topCategory}` : ''}`;
    }

    if (patterns.length > 0) {
      const topPattern = patterns[0];
      return `$${total.toFixed(2)} spent — ${topPattern.subcategory} pattern detected (${topPattern.streakCount}x streak)`;
    }

    return `$${total.toFixed(2)} spent across ${transactions.length} transactions`;
  }

  private generateFutureSummary(dayName: string, predictions: PredictedActivity[], weather: string): string {
    if (predictions.length === 0) return `No predictions for ${dayName} yet`;

    const total = predictions.reduce((s, p) => s + p.estimatedCost, 0);
    const topActivity = predictions[0];

    let summary = `Predicted: $${total.toFixed(2)} on ${dayName}`;

    if (topActivity.confidence >= 80) {
      summary += ` — ${topActivity.subcategory} is highly likely (${topActivity.confidence}% confidence)`;
    } else if (topActivity.confidence >= 60) {
      summary += ` — probably ${topActivity.subcategory?.toLowerCase() || 'some activity'}`;
    }

    if (weather === 'rainy' || weather === 'stormy') {
      summary += ' (indoor activities recommended)';
    }

    return summary;
  }

  private getTopCategory(transactions: Transaction[]): string | null {
    const cats = new Map<string, number>();
    transactions.filter(t => t.type === 'debit').forEach(t => {
      cats.set(t.category, (cats.get(t.category) || 0) + t.amount);
    });
    const sorted = Array.from(cats.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  }

  // Weather forecast setter (call from your weather service)
  setWeatherForecast(forecasts: Map<string, string>) {
    this.weatherForecast.next(forecasts);
  }
}
