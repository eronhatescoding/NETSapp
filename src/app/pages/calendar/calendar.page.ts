import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Observable, of, map } from 'rxjs';
import { UserDnaService } from '../../data/user-dna.service';
import { CalendarDnaService, DayPrediction } from '../../data/calendar-dna.service';
import { Transaction, SpendingPattern } from '../../models/transaction.model';
import { PlacesApiService, RealAlternative } from '../../data/places-api.service';

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasTransactions: boolean;
  totalSpent: number;
  isFutureWithAI: boolean;
  patterns: SpendingPattern[];
  prediction?: DayPrediction;
}

// Alternative interface matching what the template expects
interface Alternative {
  description: string;
  reason: string;
  estimatedCost: number;
  savings: number;
  address?: string;
  photoUrl?: string;
  rating?: number;
  distance?: string;
  isOpen?: boolean;
  source?: string;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: false,
})
export class CalendarPage {
  currentMonth = new Date();
  todayStr = this.toLocalDateStr(new Date());
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  calendarDays: CalendarDay[] = [];
  monthStats = { totalSpent: 0, totalIncome: 0, transactionCount: 0 };
  detectedPatterns: SpendingPattern[] = [];
  categoryBreakdown: { name: string; amount: number }[] = [];

  // Modal states
  showDetailModal = false;
  selectedDate: string | null = null;
  selectedTransactions: Transaction[] = [];
  selectedPrediction: any = null;  // Changed from DayPrediction to any for flexibility

  // DNA integration
  dnaLoaded$: Observable<boolean>;
  predictions$: Observable<Map<string, DayPrediction>> = of(new Map());
  todayTransactions: Transaction[] = [];

  dnaData: any = null;

  constructor(
    public userDnaService: UserDnaService,
    private calendarDnaService: CalendarDnaService,
    private placesApi: PlacesApiService,
    private router: Router,
    private modalController: ModalController,
  ) {
    this.dnaLoaded$ = this.userDnaService.dna$.pipe(
      map(dna => {
        this.dnaData = dna;
        return dna !== null && dna.affinityVector && dna.affinityVector.length > 0;
      })
    );

    // Recompute calendar data whenever DNA changes (new Pay transaction, etc.)
    this.userDnaService.dna$.subscribe(() => {
      this.refreshCalendarData();
    });

    this.refreshCalendarData();
  }

  private refreshCalendarData(): void {
    this.detectedPatterns = this.safeCall(() => this.userDnaService.detectPatterns()) || [];
    this.categoryBreakdown = this.safeCall(() => this.userDnaService.getCategoryBreakdown()) || [];
    this.monthStats = this.safeCall(() => this.userDnaService.getMonthStats()) || { totalSpent: 0, totalIncome: 0, transactionCount: 0 };
    this.todayTransactions = this.userDnaService.getTransactionsByDate(this.todayStr);
    this.loadMonthData();
  }

  safeCall(fn: () => any): any {
    try { return fn(); } catch (e) { return null; }
  }

  loadMonthData() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    this.calendarDays = [];
    this.monthStats = this.userDnaService.getMonthStats();

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      this.calendarDays.push(this.buildCalendarDay(date, false));
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      this.calendarDays.push(this.buildCalendarDay(date, true));
    }

    // Next month padding
    const endPadding = 42 - this.calendarDays.length;
    for (let day = 1; day <= endPadding; day++) {
      const date = new Date(year, month + 1, day);
      this.calendarDays.push(this.buildCalendarDay(date, false));
    }
  }

  private buildCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const dateStr = this.toLocalDateStr(date);
    const isToday = dateStr === this.todayStr;
    const todayDate = new Date(this.todayStr + 'T00:00:00');
    const isFuture = date > todayDate;

    const transactions = this.userDnaService.getTransactionsByDate(dateStr);
    const dayPatterns = this.detectedPatterns.filter(p =>
      p.typicalDays.includes(date.getDay())
    );

    const totalSpent = transactions
      .filter(t => t.type === 'debit')
      .reduce((s, t) => s + t.amount, 0);
    const isFutureWithAI = isFuture;

    return {
      date: dateStr,
      day: date.getDate(),
      isCurrentMonth,
      isToday,
      hasTransactions: transactions.length > 0,
      totalSpent,
      isFutureWithAI,
      patterns: dayPatterns
    };
  }

async onDayClick(day: CalendarDay) {
  this.selectedDate = day.date;
  const txs = this.userDnaService.getTransactionsByDate(day.date);

  if (day.isToday) {
    // HYBRID: always show today — real transactions + future predictions for remaining time
    this.selectedTransactions = txs;
    this.selectedPrediction = await this.generatePrediction(day.date, true);
    this.showDetailModal = true;
  } else if (txs.length > 0) {
    // Past day: only real transactions
    this.selectedTransactions = txs;
    this.selectedPrediction = null;
    this.showDetailModal = true;
  } else if (day.isFutureWithAI) {
    // Future empty day: full prediction
    this.selectedPrediction = await this.generatePrediction(day.date, false);
    this.selectedTransactions = this.selectedPrediction!.transactions || [];
    this.showDetailModal = true;
  } else {
    // Empty day
    this.selectedTransactions = [];
    this.selectedPrediction = null;
    this.showDetailModal = true;
  }
}

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedDate = null;
    this.selectedTransactions = [];
    this.selectedPrediction = null;
  }

  async closeDetailModalAndNavigate(transaction: Transaction) {
    this.showDetailModal = false;
    await new Promise(resolve => setTimeout(resolve, 150));
    this.router.navigate(['/tabs/transaction-detail', transaction.id]);
  }

  showStatsModal = false;

  openStats() {
    this.showStatsModal = true;
  }

  closeStats() {
    this.showStatsModal = false;
  }

  viewTransactionDetail(transaction: Transaction) {
    this.closeDetailModalAndNavigate(transaction);
  }

  getDayName(dateStr: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [y, m, d] = dateStr.split('-').map(Number);
    return days[new Date(y, m - 1, d).getDay()];
  }

  getTransactionIcon(category: string): string {
    const icons: Record<string, string> = {
      'Food & Beverage': 'cafe-outline',
      'Shopping': 'bag-handle-outline',
      'Entertainment': 'film-outline',
      'Education': 'school-outline',
      'Fitness': 'barbell-outline',
      'Transport': 'bus-outline',
      'Income': 'cash-outline',
      'Lifestyle': 'heart-outline'
    };
    return icons[category] || 'card-outline';
  }

  getPatternDotColor(pattern: SpendingPattern): string {
    const colors: Record<string, string> = {
      'Coffee': '#E31837',
      'Gym': '#0055A4',
      'Lunch': '#0078D4',
      'Dinner': '#00A8E8',
      'Movies': '#FF6B35',
      'Groceries': '#22C55E',
      'Clothing': '#8B5CF6',
      'Breakfast': '#F59E0B'
    };
    return colors[pattern.subcategory || ''] || '#0055A4';
  }

  getSumDebits(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  async generatePrediction(dateStr: string, timeAware: boolean = false): Promise<any> {
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];

    const weeklyPattern = this.safeCall(() => this.userDnaService.getWeeklyPattern(dayOfWeek));
    const activities: any[] = [];

    if (weeklyPattern && weeklyPattern.commonActivities.length > 0) {
      for (const act of weeklyPattern.commonActivities.slice(0, 3)) {
        if (timeAware && !this.isTimeInFuture(act.time || '12:00', dateStr)) {
          continue;
        }

        // Get REAL alternatives from APIs
        let alternatives: Alternative[] = [];
        try {
          const realAlts = await this.placesApi.getAlternatives(act.subcategory);
          alternatives = realAlts.map((alt: RealAlternative) => ({
            description: alt.name,
            reason: `${alt.reason} · ${alt.rating}★ · ${alt.distance} · ${alt.isOpen ? 'Open now' : 'Closed'}`,
            estimatedCost: this.parsePriceLevel(alt.priceLevel),
            savings: 0,
            address: alt.address,
            photoUrl: alt.photoUrl,
            rating: alt.rating,
            distance: alt.distance,
            isOpen: alt.isOpen,
            source: alt.source
          }));
        } catch (e) {
          console.warn('[Calendar] API alternatives failed, using fallback:', e);
          alternatives = this.getFallbackAlternatives(act.subcategory);
        }

        // Calculate confidence
        const allSameDayTxs = this.userDnaService.getAllTransactions().filter((t: any) =>
          t.subcategory === act.subcategory &&
          new Date(t.date + 'T00:00:00').getDay() === dayOfWeek
        );
        const times = allSameDayTxs.map((t: any) => t.time);
        const amounts = allSameDayTxs.map((t: any) => t.amount);
        const timeVariance = this.calcTimeVariance(times);
        const amountVariance = this.calcAmountVariance(amounts);

        let realConfidence: number;
        if (act.occurrences >= 10) realConfidence = 75;
        else if (act.occurrences >= 6) realConfidence = 60;
        else if (act.occurrences >= 3) realConfidence = 45;
        else realConfidence = 30;

        if (timeVariance < 15) realConfidence += 12;
        else if (timeVariance < 45) realConfidence += 6;
        else if (timeVariance > 120) realConfidence -= 15;

        if (amountVariance < 0.1) realConfidence += 8;
        else if (amountVariance < 0.4) realConfidence += 3;
        else if (amountVariance > 1.0) realConfidence -= 12;

        realConfidence = Math.max(25, Math.min(95, Math.round(realConfidence)));

        activities.push({
          time: act.time || '12:00',
          description: act.subcategory,
          reason: `${act.occurrences}x on ${dayName}s · avg $${act.amount.toFixed(2)}`,
          estimatedCost: act.amount,
          confidence: realConfidence,
          isFromPattern: true,
          weatherNote: '',
          alternatives: alternatives
        });
      }
    }

    // Fallback to DNA affinities
    if (activities.length === 0) {
      const dna = this.dnaData;
      const affinities = (dna?.affinityVector || [])
        .sort((a: any, b: any) => b.weight - a.weight)
        .slice(0, 3);

      const tagMap: Record<string, any> = {
        'fit:gym': { desc: 'Gym session', cost: 0 },
        'fnb:coffee': { desc: 'Coffee break', cost: 6.50 },
        'fnb:lunch': { desc: 'Lunch out', cost: 12.00 },
        'fnb:dinner': { desc: 'Dinner', cost: 25.00 },
        'ent:movies': { desc: 'Movie night', cost: 15.00 },
      };

      const times = ['08:00', '14:00', '19:00'];
      for (let idx = 0; idx < affinities.length; idx++) {
        const aff = affinities[idx];
        const mapped = tagMap[aff.tag] || { desc: 'Activity based on your DNA', cost: 10 };

        // Skip past times when in timeAware mode
        if (timeAware && !this.isTimeInFuture(times[idx] || '12:00', dateStr)) {
          continue;
        }

        // Get real alternatives for fallback too
        let alternatives: Alternative[] = [];
        try {
          const realAlts = await this.placesApi.getAlternatives(mapped.desc);
          alternatives = realAlts.map((alt: RealAlternative) => ({
            description: alt.name,
            reason: `${alt.reason} · ${alt.rating}★ · ${alt.distance}`,
            estimatedCost: this.parsePriceLevel(alt.priceLevel),
            savings: 0,
            photoUrl: alt.photoUrl,
            rating: alt.rating,
            distance: alt.distance,
            isOpen: alt.isOpen,
            source: alt.source
          }));
        } catch (e) {
          alternatives = this.getFallbackAlternatives(mapped.desc);
        }

        activities.push({
          time: times[idx] || '12:00',
          description: mapped.desc,
          reason: `Your DNA affinity: ${aff.tag} (${Math.round(aff.weight * 100)}%)`,
          estimatedCost: mapped.cost,
          confidence: Math.round(aff.weight * 100),
          isFromPattern: false,
          weatherNote: '',
          alternatives: alternatives
        });
      }
    }

    const totalSpend = activities.reduce((sum, a) => sum + a.estimatedCost, 0);
    const activityList = activities.map((a: any) => a.description).join(', ');

    const isToday = dateStr === this.todayStr;
    let aiSummary: string;
    if (isToday && timeAware) {
      aiSummary = activities.length > 0
        ? `Still to come today: ${activityList}.`
        : 'No more predicted activities for the rest of today.';
    } else {
      aiSummary = `Based on your spending DNA, ${dayName}s typically involve ${activityList || 'your favorite activities'}.`;
    }

    return {
      aiSummary,
      confidence: activities[0]?.confidence || 60,
      totalPredictedSpend: totalSpend,
      predictedActivities: activities,
      transactions: []
    };
  }

  private toLocalDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private isTimeInFuture(timeStr: string, dateStr: string): boolean {
    const now = new Date();
    const todayStr = this.toLocalDateStr(now);
    if (dateStr !== todayStr) return true;
    const [h, m] = timeStr.split(':').map(Number);
    const timeMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return timeMinutes > nowMinutes;
  }

  private calcTimeVariance(timeStrs: string[]): number {
    if (timeStrs.length < 2) return 0;
    const minutes = timeStrs.map(t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    });
    const avg = minutes.reduce((a, b) => a + b, 0) / minutes.length;
    const variance = minutes.reduce((sum, m) => sum + Math.pow(m - avg, 2), 0) / minutes.length;
    return Math.sqrt(variance);
  }

  private calcAmountVariance(amounts: number[]): number {
    if (amounts.length < 2) return 0;
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    return stdDev / avg;
  }

  private parsePriceLevel(priceLevel: string): number {
    const map: Record<string, number> = {
      '$': 5, '$$': 15, '$$$': 35, '$$$$': 80
    };
    return map[priceLevel] || 15;
  }

  private getFallbackAlternatives(subcategory: string): Alternative[] {
    const fallbacks: Record<string, Alternative[]> = {
      'Gym': [
        { description: 'ActiveSG Gym Clementi', reason: 'Your usual spot · $2 · 0.5km · Open now', estimatedCost: 2, savings: 0 }
      ],
      'Coffee': [
        { description: 'PPP Coffee Star Vista', reason: '14x visits · $6.50 · 0.8km', estimatedCost: 6.50, savings: 0 }
      ],
      'Lunch': [
        { description: 'Kopitiam 448', reason: '9x visits · $5.50 · 0.3km', estimatedCost: 5.50, savings: 0 }
      ],
      'Dinner': [
        { description: 'Seoul Yummy JEM', reason: 'Wednesday spot · $28 · 2.5km', estimatedCost: 28, savings: 0 }
      ]
    };
    return fallbacks[subcategory] || [
      { description: 'Local favorite', reason: 'Based on your DNA', estimatedCost: 10, savings: 0 }
    ];
  }
}