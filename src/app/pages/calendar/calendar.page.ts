import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Transaction, SpendingPattern } from '../../models/transaction.model';
import { UserDnaService } from '../../data/user-dna.service';

interface CalendarDay {
  date: number;
  fullDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  transactions: Transaction[];
  hasTransactions: boolean;
  isFutureWithAI: boolean;
  dayOfWeek: number;
  patterns: SpendingPattern[];
  totalSpent: number;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: false,
})
export class CalendarPage implements OnInit {
  currentMonth: Date = new Date(2026, 5, 1);
  calendarDays: CalendarDay[] = [];
  monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  selectedDate: string | null = null;
  selectedTransactions: Transaction[] = [];
  showDetailModal: boolean = false;
  showStatsModal: boolean = false;

  monthStats: any;
  categoryBreakdown: any[] = [];
  detectedPatterns: SpendingPattern[] = [];
  todayStr: string = '2026-06-17';

  constructor(public userDnaService: UserDnaService, private router: Router) {}

  ngOnInit() {
    this.generateCalendar();
    this.monthStats = this.userDnaService.getMonthStats();
    this.categoryBreakdown = this.userDnaService.getCategoryBreakdown();
    this.detectedPatterns = this.userDnaService.detectPatterns();
  }

  generateCalendar() {
    this.calendarDays = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      this.calendarDays.push({
        date: daysInPrevMonth - i, fullDate: '', isCurrentMonth: false,
        isToday: false, isFuture: false, transactions: [],
        hasTransactions: false, isFutureWithAI: false, dayOfWeek: 0,
        patterns: [], totalSpent: 0
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const transactions = this.userDnaService.getTransactionsByDate(dateStr);
      const isToday = dateStr === this.todayStr;
      const isFuture = dateStr > this.todayStr;
      const dow = new Date(dateStr + 'T00:00:00').getDay();
      const totalSpent = transactions.filter(t => t.type === 'debit').reduce((a,t) => a + t.amount, 0);
      const patterns = this.detectedPatterns.filter(p => p.typicalDays.includes(dow) && p.confidence > 60);

      this.calendarDays.push({
        date: day, fullDate: dateStr, isCurrentMonth: true,
        isToday, isFuture, transactions, hasTransactions: transactions.length > 0,
        isFutureWithAI: isFuture, dayOfWeek: dow, patterns, totalSpent
      });
    }
  }

  onDayClick(day: CalendarDay) {
    if (!day.isCurrentMonth) return;
    if (day.isFuture) this.router.navigate(['/day-plan', day.fullDate]);
    else if (day.hasTransactions) {
      this.selectedDate = day.fullDate;
      this.selectedTransactions = day.transactions;
      this.showDetailModal = true;
    }
  }

  closeDetailModal() { this.showDetailModal = false; this.selectedDate = null; this.selectedTransactions = []; }
  openStats() { this.showStatsModal = true; }
  closeStats() { this.showStatsModal = false; }

  viewTransactionDetail(t: Transaction) {
    this.closeDetailModal();
    this.router.navigate(['/transaction-detail', t.id]);
  }

  getDayName(d: string): string {
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(d+'T00:00:00').getDay()];
  }
  getTransactionIcon(c: string): string {
    const i: Record<string,string> = {'Food & Beverage':'restaurant','Transport':'bus','Entertainment':'film','Fitness':'barbell','Shopping':'bag','Education':'school','Income':'cash'};
    return i[c] || 'card';
  }
  getPatternDotColor(p: SpendingPattern): string {
    if (p.subcategory === 'Coffee') return '#8B4513';
    if (p.subcategory === 'Gym') return '#22c55e';
    if (p.category === 'Shopping') return '#f59e0b';
    return 'var(--ion-color-primary)';
  }
  getSpendingLevel(amount: number): string {
    if (amount > 50) return 'high';
    if (amount > 20) return 'medium';
    return 'low';
  }
  getSumDebits(transactions: any[]): number {
  return transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
}
}
