import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  Firestore,
  collection, query, where, onSnapshot,
  doc, setDoc,
} from '@angular/fire/firestore';
import {
  Transaction, SpendingPattern, WeeklyPattern,
  UserDNA, TagAffinity, Persona,
} from '../models/transaction.model';
import { PERSONA_LIBRARY } from './tag-taxonomy';
import { MERCHANT_BY_ID } from './merchant-catalogue';
import { DEMO_USER_ID } from './seed.service';

@Injectable({ providedIn: 'root' })
export class UserDnaService {

  // Start empty — all data comes from Firestore (seeded or live)
  private transactions: Transaction[] = [];

  private txnSubject = new BehaviorSubject<Transaction[]>([]);

  /** Reactive stream of all transactions — updates after addTransaction() or Firestore sync */
  readonly transactions$ = this.txnSubject.asObservable();

  /** Live UserDNA — recomputes whenever transactions change */
  readonly dna$ = this.txnSubject.pipe(
    map(() => this.computeUserDNA()),
    shareReplay(1)
  );

  constructor(private firestore: Firestore) {
    this.syncFromFirestore();
  }

  /** Listen to Firestore; merge new docs without wiping existing data */
  private syncFromFirestore(): void {
    const q = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', DEMO_USER_ID)
    );

    onSnapshot(q,
      snapshot => {
        const firestoreTxns = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Transaction);
        const existingIds = new Set(this.transactions.map(t => t.id));

        // Only append NEW Firestore docs — never wipe seed data
        const newTxns = firestoreTxns.filter(t => !existingIds.has(t.id));

        if (newTxns.length > 0) {
          this.transactions = [...this.transactions, ...newTxns].sort(
            (a, b) => (a.date + a.time).localeCompare(b.date + b.time)
          );
          this.txnSubject.next([...this.transactions]);
          console.log(`[DNA] Merged ${newTxns.length} Firestore txns. Total: ${this.transactions.length}`);
        } else if (this.transactions.length === 0 && firestoreTxns.length > 0) {
          // First load: Firestore has data but local is empty
          this.transactions = [...firestoreTxns].sort(
            (a, b) => (a.date + a.time).localeCompare(b.date + b.time)
          );
          this.txnSubject.next([...this.transactions]);
          console.log(`[DNA] Loaded ${firestoreTxns.length} txns from Firestore.`);
        } else if (this.transactions.length === 0) {
          console.log('[DNA] No transactions in Firestore yet — waiting for seed...');
        }
      },
      err => {
        console.warn('[UserDnaService] Firestore read error:', err?.message ?? err);
      }
    );
  }

  async addTransaction(partial: Omit<Transaction, 'id'>): Promise<string> {
    const ref = doc(collection(this.firestore, 'transactions'));
    const txn: Transaction = { ...partial, id: ref.id };

    // Optimistic update: add to local state immediately
    this.transactions.push(txn);
    this.transactions.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    this.txnSubject.next([...this.transactions]);

    try {
      await setDoc(ref, txn);
    } catch (err) {
      console.warn('[UserDnaService] Firestore write failed — keeping local transaction:', err);
    }
    return ref.id;
  }

  async addExternalTransaction(partial: any): Promise<string> {
    const ref = doc(collection(this.firestore, 'transactions'));
    const txn: Transaction = {
      ...partial,
      id: ref.id,
      userId: DEMO_USER_ID,
      date: partial.date || new Date().toISOString().split('T')[0],
      time: partial.time || '12:00',
      amount: partial.amount || 0,
      type: partial.type || 'debit',
      category: partial.category || 'Entertainment',
      subcategory: partial.subcategory || 'General',
      description: partial.description || 'External activity',
      merchant: partial.merchant || 'Unknown',
      location: partial.location || 'Singapore',
      paymentMethod: partial.paymentMethod || 'NETS Pay',
      weatherCondition: partial.weatherCondition || 'sunny',
      tags: partial.tags || [],
      merchantId: partial.merchantId || null,
      isPlanned: partial.isPlanned || false,   // ← ADD THIS
    };

    // Optimistic update
    this.transactions.push(txn);
    this.transactions.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    this.txnSubject.next([...this.transactions]);

    try {
      await setDoc(ref, txn);
    } catch (err) {
      console.warn('[UserDnaService] Firestore write failed — keeping local transaction:', err);
    }
    return ref.id;
  }

  /** Returns the current UserDNA snapshot (synchronous). Use dna$ for reactive UI. */
  getUserDNA(): UserDNA {
    return this.computeUserDNA();
  }

  /**
   * Compute full UserDNA from current in-memory transactions.
   */
  computeUserDNA(): UserDNA {
    const all = this.txnSubject.getValue();
    const debits = all.filter(t => t.type === 'debit' && t.amount > 0 && !t.isPlanned);   // ← exclude planned
    const credits = all.filter(t => t.type === 'credit');
    const totalSpent = debits.reduce((s, t) => s + t.amount, 0);
    const totalIncome = credits.reduce((s, t) => s + t.amount, 0);

    // Category breakdown
    const catMap = new Map<string, number>();
    debits.forEach(t => catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount));
    const categoryBreakdown = Array.from(catMap.entries())
      .map(([cat, amt]) => ({
        category: cat as any,
        amount: Math.round(amt * 100) / 100,
        pct: totalSpent > 0 ? Math.round(amt / totalSpent * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Top merchants
    const mMap = new Map<string, { name: string; count: number; spend: number }>();
    debits.forEach(t => {
      const key = t.merchantId || t.merchant || 'unknown';
      const m = mMap.get(key) || { name: t.merchant || key, count: 0, spend: 0 };
      m.count++;
      m.spend += t.amount;
      mMap.set(key, m);
    });
    const topMerchants = Array.from(mMap.entries())
      .map(([mid, m]) => ({ merchantId: mid, name: m.name, count: m.count, spend: Math.round(m.spend * 100) / 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Tag affinity vector
    const tagMap = new Map<string, { count: number; spend: number; lastSeen: string }>();
    debits.forEach(t => {
      if (!t.tags?.length) return;
      const splitSpend = t.amount / t.tags.length;
      t.tags.forEach(tag => {
        const e = tagMap.get(tag) || { count: 0, spend: 0, lastSeen: '2000-01-01' };
        e.count++;
        e.spend += splitSpend;
        if (t.date > e.lastSeen) e.lastSeen = t.date;
        tagMap.set(tag, e);
      });
    });

    const today = new Date().toISOString().split('T')[0];
    const totalTagCount = Array.from(tagMap.values()).reduce((s, v) => s + v.count, 0);
    const totalTagSpend = Array.from(tagMap.values()).reduce((s, v) => s + v.spend, 0);

    const rawScores = new Map<string, number>();
    tagMap.forEach((v, tag) => {
      const freqShare = totalTagCount > 0 ? v.count / totalTagCount : 0;
      const daysSince = Math.max(0,
        (new Date(today).getTime() - new Date(v.lastSeen).getTime()) / 86_400_000);
      const recencyScore = Math.exp(-0.05 * daysSince);
      const spendShare = totalTagSpend > 0 ? v.spend / totalTagSpend : 0;
      rawScores.set(tag, 0.5 * freqShare + 0.3 * recencyScore + 0.2 * spendShare);
    });

    const maxRaw = Math.max(0, ...rawScores.values());
    const affinityVector: TagAffinity[] = [];
    tagMap.forEach((v, tag) => {
      affinityVector.push({
        tag,
        weight: maxRaw > 0 ? Math.round((rawScores.get(tag)! / maxRaw) * 1000) / 1000 : 0,
        count: v.count,
        totalSpend: Math.round(v.spend * 100) / 100,
        lastSeen: v.lastSeen,
      });
    });
    affinityVector.sort((a, b) => b.weight - a.weight);

    const personas = this.derivePersonas(affinityVector);

    return {
      userId: DEMO_USER_ID,
      generatedAt: new Date().toISOString(),
      totals: {
        spent: Math.round(totalSpent * 100) / 100,
        income: Math.round(totalIncome * 100) / 100,
        txnCount: all.length,
      },
      categoryBreakdown,
      topMerchants,
      affinityVector,
      personas,
    };
  }

  private derivePersonas(affinityVector: TagAffinity[]): Persona[] {
    const topTags = new Set(affinityVector.slice(0, 20).map(a => a.tag));
    const matched: Persona[] = [];
    for (const persona of PERSONA_LIBRARY) {
      if (persona.triggerTags.some(t => topTags.has(t))) {
        matched.push(persona);
      }
      if (matched.length >= 3) break;
    }
    return matched;
  }

  /**
   * JSON export for Eron's recommendation engine.
   */
  exportDnaJson(): string {
    const dna = this.computeUserDNA();
    const merchantExport = Array.from(MERCHANT_BY_ID.values()).map(m => ({
      id: m.id,
      tags: m.tags,
    }));
    return JSON.stringify({
      userId: dna.userId,
      affinityVector: dna.affinityVector,
      merchants: merchantExport,
    }, null, 2);
  }

  // ─────────────────────────────────────────────────────────────
  // PATTERN RECOGNITION ENGINE
  // ─────────────────────────────────────────────────────────────

  getAllTransactions(): Transaction[] {
    return [...this.transactions];
  }

  getTransactionsByDate(date: string): Transaction[] {
    return this.transactions.filter(t => t.date === date);
  }

  getTransactionsByDateRange(start: string, end: string): Transaction[] {
    return this.transactions.filter(t => t.date >= start && t.date <= end);
  }

  /** Detect spending patterns from transaction history */
  detectPatterns(): SpendingPattern[] {
    const patterns: SpendingPattern[] = [];
    const realTxns = this.transactions.filter(t => !t.isPlanned);
    const byCategory = this.groupBy(this.transactions, 'category');

    for (const [cat, txs] of Object.entries(byCategory)) {
      const bySub = this.groupBy(txs, 'subcategory');
      for (const [sub, subTxs] of Object.entries(bySub)) {
        if (!sub || sub === 'undefined') continue;
        const pat = this.analyzePattern(subTxs, cat, sub);
        if (pat) patterns.push(pat);
      }
    }
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzePattern(txs: Transaction[], category: string, subcategory: string): SpendingPattern | null {
    if (txs.length < 2) return null;

    const amounts = txs.map(t => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);

    // Day-of-week analysis
    const dayCounts = new Map<number, number>();
    txs.forEach(t => {
      const dow = new Date(t.date + 'T00:00:00').getDay();
      dayCounts.set(dow, (dayCounts.get(dow) || 0) + 1);
    });
    const typicalDays = Array.from(dayCounts.entries())
      .filter(([, c]) => c >= 2)
      .map(([d]) => d)
      .sort();

    // Time range
    const times = txs.map(t => t.time).sort();
    const timeRange = times.length > 1 ? `${times[0]}-${times[times.length - 1]}` : times[0];

    // Frequency detection
    const dates = txs.map(t => new Date(t.date + 'T00:00:00').getTime()).sort((a, b) => a - b);
    const gaps = dates.slice(1).map((d, i) => (d - dates[i]) / (1000 * 60 * 60 * 24));
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

    let frequency: SpendingPattern['frequency'] = 'occasional';
    if (avgGap <= 1.5) frequency = 'daily';
    else if (avgGap <= 3.5) frequency = 'weekly';
    else if (avgGap <= 10) frequency = 'biweekly';
    else if (avgGap <= 20) frequency = 'monthly';

    // Streak detection
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const gap = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      if (gap <= 2) streak++;
      else streak = 1;
    }

    // Confidence based on consistency
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (stdDev / avg) * 50);
    const dayConsistency = typicalDays.length > 0 ? 80 : 40;
    const confidence = Math.round((consistency + dayConsistency + Math.min(txs.length * 10, 50)) / 3);

    // Weather preference
    const weatherCounts = new Map<string, number>();
    txs.forEach(t => { if (t.weatherCondition) weatherCounts.set(t.weatherCondition, (weatherCounts.get(t.weatherCondition) || 0) + 1); });
    const totalW = Array.from(weatherCounts.values()).reduce((a, b) => a + b, 0);
    const sunnyPct = (weatherCounts.get('sunny') || 0) / totalW;
    const rainyPct = (weatherCounts.get('rainy') || 0) / totalW;
    let weatherPreference: SpendingPattern['weatherPreference'] = 'any';
    if (sunnyPct > 0.7 && category === 'Entertainment') weatherPreference = 'outdoor';
    else if (rainyPct > 0.5) weatherPreference = 'indoor';
    else if (sunnyPct > 0.5) weatherPreference = 'dry';

    return {
      category, subcategory,
      frequency,
      typicalDays,
      typicalTimeRange: timeRange,
      typicalAmount: Math.round(avg * 100) / 100,
      typicalAmountRange: [Math.round(min * 100) / 100, Math.round(max * 100) / 100],
      confidence: Math.min(confidence, 98),
      lastOccurrence: txs[txs.length - 1].date,
      streakCount: streak,
      weatherPreference
    };
  }

  /** Get weekly patterns for a specific day of week */
  getWeeklyPattern(dayOfWeek: number): WeeklyPattern {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayTxs = this.transactions.filter(t => {
      return new Date(t.date + 'T00:00:00').getDay() === dayOfWeek && !t.isPlanned;   // ← exclude planned
    });

    const bySub = this.groupBy(dayTxs.filter(t => t.type === 'debit'), 'subcategory');
    const commonActivities = Object.entries(bySub)
      .filter(([sub]) => sub && sub !== 'undefined')
      .map(([sub, txs]) => ({
        category: txs[0].category,
        subcategory: sub,
        time: this.mode(txs.map(t => t.time)),
        amount: Math.round(txs.reduce((a, t) => a + t.amount, 0) / txs.length * 100) / 100,
        confidence: Math.min(txs.length * 25, 95),
        occurrences: txs.length
      }))
      .sort((a, b) => b.occurrences - a.occurrences);

    const totalSpent = dayTxs.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0);

    return {
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      commonActivities,
      totalSpent: Math.round(totalSpent * 100) / 100,
      transactionCount: dayTxs.length
    };
  }

  getSameDayComparison(targetDate: string): { sameDayLastWeek: string; avgSpent: number; trend: 'up' | 'down' | 'stable' } {
    const target = new Date(targetDate + 'T00:00:00');
    const dow = target.getDay();
    const sameDayTxs = this.transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getDay() === dow && t.date !== targetDate && t.type === 'debit' && !t.isPlanned;   // ← exclude planned
    });

    const avgSpent = sameDayTxs.length > 0
      ? sameDayTxs.reduce((a, t) => a + t.amount, 0) / sameDayTxs.length
      : 0;

    const lastWeek = new Date(target);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];
    const lastWeekTxs = this.transactions.filter(t => t.date === lastWeekStr && t.type === 'debit' && !t.isPlanned);   // ← exclude planned
    const lastWeekTotal = lastWeekTxs.reduce((a, t) => a + t.amount, 0);

    const targetTxs = this.transactions.filter(t => t.date === targetDate && t.type === 'debit' && !t.isPlanned);   // ← exclude planned
    const targetTotal = targetTxs.reduce((a, t) => a + t.amount, 0);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (targetTotal > lastWeekTotal * 1.15) trend = 'up';
    else if (targetTotal < lastWeekTotal * 0.85) trend = 'down';

    return { sameDayLastWeek: lastWeekStr, avgSpent: Math.round(avgSpent * 100) / 100, trend };
  }

  getTransactionById(id: string): Transaction | undefined {
    return this.transactions.find(t => t.id === id);
  }

  getMonthStats() {
    const debits = this.transactions.filter(t => t.type === 'debit' && !t.isPlanned);   // ← exclude planned
    const credits = this.transactions.filter(t => t.type === 'credit');
    return {
      totalSpent: debits.reduce((a, t) => a + t.amount, 0),
      totalIncome: credits.reduce((a, t) => a + t.amount, 0),
      transactionCount: this.transactions.filter(t => !t.isPlanned).length,   // ← count only real
      avgTransaction: debits.length > 0 ? debits.reduce((a, t) => a + t.amount, 0) / debits.length : 0
    };
  }

  getCategoryBreakdown() {
    const map = new Map<string, number>();
    this.transactions.filter(t => t.type === 'debit' && !t.isPlanned).forEach(t => {   // ← exclude planned
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }

  // ─── helpers ─────────────────────────────────────────────────
  private groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return arr.reduce((groups, item) => {
      const k = String(item[key] ?? 'undefined');
      groups[k] = groups[k] || [];
      groups[k].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private mode(arr: string[]): string {
    const counts = new Map<string, number>();
    arr.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? arr[0];
  }
}