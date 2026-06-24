import { Injectable } from '@angular/core';
import {
  Firestore,
  collection, query, where, getDocs, getDoc,
  doc, setDoc, writeBatch,
} from '@angular/fire/firestore';
import { Transaction, Merchant } from '../models/transaction.model';
import { MERCHANT_CATALOGUE } from './merchant-catalogue';

export const DEMO_USER_ID = 'demo_user_001';

@Injectable({ providedIn: 'root' })
export class SeedService {

  constructor(private firestore: Firestore) {}

  /**
   * Idempotent seed — skips if already seeded.
   * Returns { merchants, transactions } counts or zeros if skipped.
   */
  async seedIfEmpty(): Promise<{ merchants: number; transactions: number }> {
    const sentinel = await getDoc(doc(this.firestore, '_meta', 'seeded'));
    if (sentinel.exists()) return { merchants: 0, transactions: 0 };
    return this.forceSeed();
  }

  /** Always re-seeds — used by the "Seed demo data" button in Settings. */
  async forceSeed(): Promise<{ merchants: number; transactions: number }> {
    const [mc, tc] = await Promise.all([
      this.seedMerchants(),
      this.seedTransactions(),
    ]);
    await setDoc(doc(this.firestore, '_meta', 'seeded'), { at: new Date().toISOString() });
    return { merchants: mc, transactions: tc };
  }

  // ─── private helpers ────────────────────────────────────────

  private async seedMerchants(): Promise<number> {
    const batch = writeBatch(this.firestore);
    for (const m of MERCHANT_CATALOGUE) {
      batch.set(doc(this.firestore, 'merchants', m.id), m, { merge: true });
    }
    await batch.commit();
    return MERCHANT_CATALOGUE.length;
  }

  private async seedTransactions(): Promise<number> {
    // Delete existing demo transactions first for a clean re-seed
    const q = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', DEMO_USER_ID)
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      const delBatch = writeBatch(this.firestore);
      existing.docs.forEach(d => delBatch.delete(d.ref));
      await delBatch.commit();
    }

    const txns = this.generateDemoTransactions();

    // Firestore batch limit = 500 writes; chunk if needed
    const CHUNK = 400;
    for (let i = 0; i < txns.length; i += CHUNK) {
      const batch = writeBatch(this.firestore);
      txns.slice(i, i + CHUNK).forEach(t => {
        batch.set(doc(this.firestore, 'transactions', t.id!), t);
      });
      await batch.commit();
    }

    return txns.length;
  }

  // ─── deterministic demo transaction generator ────────────────

  private generateDemoTransactions(): Transaction[] {
    const txns: Transaction[] = [];
    let seq = 1;
    const id = () => `demo_t${String(seq++).padStart(3, '0')}`;

    const find = (mid: string): Merchant => MERCHANT_CATALOGUE.find(m => m.id === mid)!;

    // Pools keyed by role
    const coffeePool  = ['starbucks', 'ya-kun', 'toast-box', 'huggs', 'luckin'];
    const btPool      = ['gong-cha', 'koi', 'liho', 'playmade', 'chicha', 'rb-tea'];
    const lunchPool   = ['kopitiam', 'mcdonalds', 'koufu', 'subway', 'food-republic', 'encik-tan', 'jollibee'];
    const dinnerPool  = ['saizeriya', 'sushi-tei', 'ramen-keisuke', 'shake-shack', 'astons', 'kko-kko', 'seoul-garden', 'genki-sushi'];
    const shopPool    = ['uniqlo', 'cotton-on', 'watsons', 'innisfree', 'hm'];

    const days = this.dateRange('2026-04-01', '2026-06-24');
    let weekIdx = 0;

    for (const date of days) {
      const dow  = new Date(date + 'T00:00:00').getDay(); // 0=Sun..6=Sat
      const h    = this.hash(date);         // 0-99, deterministic per day
      const dom  = parseInt(date.split('-')[2], 10);
      const isWeekday = dow >= 1 && dow <= 5;
      const isSat = dow === 6;
      const isSun = dow === 0;

      if (isSat) weekIdx++;

      // ── Weekday patterns ──────────────────────────────────────

      // Morning coffee Mon/Wed/Fri, 70% chance
      if ([1, 3, 5].includes(dow) && h < 70) {
        txns.push(this.makeTxn(id(), date, '08:30', find(this.pick(coffeePool, h)), 'Coffee'));
      }

      // Bubble tea Tue/Thu, 65% chance
      if ([2, 4].includes(dow) && h < 65) {
        txns.push(this.makeTxn(id(), date, '15:30', find(this.pick(btPool, h + 10)), 'Bubble Tea'));
      }

      // Weekday lunch Mon-Fri, 75% chance
      if (isWeekday && h < 75) {
        txns.push(this.makeTxn(id(), date, '12:15', find(this.pick(lunchPool, h + 20)), 'Lunch'));
      }

      // Gym Tue/Thu, 85% chance
      if ([2, 4].includes(dow) && h < 85) {
        txns.push(this.makeTxn(id(), date, '19:00', find('activesg'), 'Gym'));
      }

      // ── Weekend patterns ──────────────────────────────────────

      // Saturday gym, 70% chance
      if (isSat && h < 70) {
        txns.push(this.makeTxn(id(), date, '10:00', find('activesg'), 'Gym'));
      }

      // Saturday groceries every week, alternating FairPrice / Sheng Siong
      if (isSat) {
        const grocer = weekIdx % 2 === 0 ? 'fairprice' : 'sheng-siong';
        txns.push(this.makeTxn(id(), date, '11:30', find(grocer), 'Groceries',
          Math.round(find(grocer).typicalAmount * (0.8 + (h / 100) * 0.5) * 100) / 100
        ));
      }

      // Saturday cinema every 3rd week
      if (isSat && weekIdx % 3 === 0) {
        txns.push(this.makeTxn(id(), date, '20:00', find('golden-village'), 'Movies'));
      }

      // Saturday dinner, 60% chance
      if (isSat && h < 60) {
        txns.push(this.makeTxn(id(), date, '19:00', find(this.pick(dinnerPool, h + 5)), 'Dinner'));
      }

      // Sunday bubble tea, 50% chance
      if (isSun && h < 50) {
        txns.push(this.makeTxn(id(), date, '14:00', find(this.pick(btPool, h + 30)), 'Bubble Tea'));
      }

      // Sunday dinner/brunch, 45% chance
      if (isSun && h < 45) {
        txns.push(this.makeTxn(id(), date, '12:00', find(this.pick(dinnerPool, h + 15)), 'Brunch'));
      }

      // ── Monthly fixed ─────────────────────────────────────────

      if (dom === 1) {
        // Spotify subscription
        txns.push(this.makeTxn(id(), date, '00:01', find('spotify'), 'Streaming'));
        // Monthly allowance income
        txns.push({
          id: id(), userId: DEMO_USER_ID, date, time: '09:00',
          amount: 500, type: 'credit', category: 'Income',
          subcategory: 'Allowance', description: 'Monthly Allowance',
          merchant: 'Parents', tags: [],
        });
      }

      if (dom === 8) {
        txns.push(this.makeTxn(id(), date, '00:01', find('netflix'), 'Streaming'));
      }

      // ── Occasional shopping — first Saturday of each month ────
      if (isSat && dom <= 7) {
        txns.push(this.makeTxn(id(), date, '14:30', find(this.pick(shopPool, h + 50)), 'Shopping'));
      }
    }

    return txns;
  }

  private makeTxn(
    id: string,
    date: string,
    time: string,
    merchant: Merchant,
    subcategory: string,
    customAmount?: number
  ): Transaction {
    const h = this.hash(date + time);
    const variance = 0.85 + (h / 100) * 0.3;    // ±15% natural price variation
    const amount = customAmount ?? Math.round(merchant.typicalAmount * variance * 100) / 100;
    return {
      id,
      userId: DEMO_USER_ID,
      date,
      time,
      amount,
      type: 'debit',
      category: merchant.category,
      subcategory,
      description: merchant.name,
      merchant: merchant.name,
      merchantId: merchant.id,
      tags: [...merchant.tags],
      paymentMethod: 'NETS Pay',
    };
  }

  /** Deterministic hash of a string → 0..99 */
  private hash(s: string): number {
    let h = 0;
    for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return h % 100;
  }

  private pick<T>(arr: T[], seed: number): T {
    return arr[seed % arr.length];
  }

  private dateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const cur = new Date(start + 'T00:00:00');
    const last = new Date(end + 'T00:00:00');
    while (cur <= last) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
}
