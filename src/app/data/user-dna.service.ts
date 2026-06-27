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

  // ─────────────────────────────────────────────────────────────
  // 69 HARDCODED TRANSACTIONS (June 1–17, 2026) with weather data
  // ─────────────────────────────────────────────────────────────
  private transactions: Transaction[] = [
    // ── WEEK 1: June 1–7 ────────────────────────────────────────
    // Monday June 1
    { id: 't001', date: '2026-06-01', time: '08:30', amount: 2.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Iced Latte', merchant: 'Starbucks', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't002', date: '2026-06-01', time: '12:15', amount: 5.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Chicken Rice', merchant: 'Kopitiam', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't003', date: '2026-06-01', time: '18:45', amount: 12.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Ramen Set', merchant: 'Ippudo', location: 'Star Vista', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't004', date: '2026-06-01', time: '19:30', amount: 15.90, type: 'debit', category: 'Entertainment', subcategory: 'Streaming', description: 'Netflix Subscription', merchant: 'Netflix', location: 'Online', paymentMethod: 'Credit Card', weatherCondition: 'cloudy' },
    // Tuesday June 2
    { id: 't005', date: '2026-06-02', time: '08:35', amount: 2.20, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Kopi-O Kosong', merchant: 'Toast Box', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't006', date: '2026-06-02', time: '12:00', amount: 6.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Nasi Lemak', merchant: 'Punggol Nasi Lemak', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't007', date: '2026-06-02', time: '14:00', amount: 2.00, type: 'debit', category: 'Fitness', subcategory: 'Gym', description: 'Gym Entry', merchant: 'ActiveSG Gym', location: 'Clementi Stadium', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't008', date: '2026-06-02', time: '19:00', amount: 8.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Fishball Noodles', merchant: 'Ah Hock', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    // Wednesday June 3
    { id: 't009', date: '2026-06-03', time: '08:25', amount: 2.80, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Cappuccino', merchant: 'PPP Coffee', location: 'Star Vista', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    { id: 't010', date: '2026-06-03', time: '12:30', amount: 4.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Ban Mian', merchant: 'Qiu Lian', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    { id: 't011', date: '2026-06-03', time: '15:00', amount: 45.00, type: 'debit', category: 'Shopping', subcategory: 'Clothing', description: 'Uniqlo T-Shirts x3', merchant: 'Uniqlo', location: 'Jurong East', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    { id: 't012', date: '2026-06-03', time: '19:30', amount: 22.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Korean BBQ Set', merchant: 'Seoul Yummy', location: 'JEM', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    // Thursday June 4
    { id: 't013', date: '2026-06-04', time: '08:40', amount: 2.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Iced Americano', merchant: 'Huggs Coffee', location: 'Clementi MRT', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't014', date: '2026-06-04', time: '12:15', amount: 5.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Chicken Rice', merchant: 'Kopitiam', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't015', date: '2026-06-04', time: '14:00', amount: 2.00, type: 'debit', category: 'Fitness', subcategory: 'Gym', description: 'Gym Entry', merchant: 'ActiveSG Gym', location: 'Clementi Stadium', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't016', date: '2026-06-04', time: '19:00', amount: 7.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Pasta Aglio Olio', merchant: 'Saizeriya', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    // Friday June 5
    { id: 't017', date: '2026-06-05', time: '08:30', amount: 2.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Iced Latte', merchant: 'Starbucks', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't018', date: '2026-06-05', time: '12:00', amount: 6.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Bak Kut Teh', merchant: 'Song Fa', location: 'West Coast', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't019', date: '2026-06-05', time: '16:00', amount: 8.00, type: 'debit', category: 'Education', subcategory: 'Stationery', description: 'Muji Notebooks x2', merchant: 'Muji', location: 'JEM', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't020', date: '2026-06-05', time: '20:00', amount: 14.00, type: 'debit', category: 'Entertainment', subcategory: 'Movies', description: 'Movie Ticket', merchant: 'GV', location: 'Jurong Point', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    // Saturday June 6
    { id: 't021', date: '2026-06-06', time: '09:00', amount: 3.20, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Flat White', merchant: 'Nylon Coffee', location: 'Everton Park', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't022', date: '2026-06-06', time: '10:30', amount: 4.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Breakfast', description: 'Kaya Toast Set', merchant: 'Killiney', location: 'Holland V', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't023', date: '2026-06-06', time: '13:00', amount: 35.00, type: 'debit', category: 'Shopping', subcategory: 'Groceries', description: 'NTUC Weekly Groceries', merchant: 'NTUC FairPrice', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't024', date: '2026-06-06', time: '15:00', amount: 18.00, type: 'debit', category: 'Entertainment', subcategory: 'Bowling', description: 'Bowling 2 Games', merchant: 'K Bowling', location: 'Orchard Central', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't025', date: '2026-06-06', time: '19:30', amount: 28.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Hotpot Buffet', merchant: 'Haidilao', location: 'JEM', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    // Sunday June 7
    { id: 't026', date: '2026-06-07', time: '10:00', amount: 3.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Cold Brew', merchant: 'PPP Coffee', location: 'Star Vista', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't027', date: '2026-06-07', time: '11:00', amount: 12.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Brunch', description: 'Eggs Benedict', merchant: 'Wild Honey', location: 'Mandarin Gallery', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't028', date: '2026-06-07', time: '14:00', amount: 0.00, type: 'debit', category: 'Entertainment', subcategory: 'Park', description: 'Botanic Gardens Walk', merchant: 'NParks', location: 'Botanic Gardens', paymentMethod: 'Free', weatherCondition: 'sunny' },
    { id: 't029', date: '2026-06-07', time: '18:00', amount: 16.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Pizza', merchant: 'Peperoni', location: 'Greenwood', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },

    // ── WEEK 2: June 8–14 ───────────────────────────────────────
    // Monday June 8
    { id: 't030', date: '2026-06-08', time: '08:30', amount: 2.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Iced Latte', merchant: 'Starbucks', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    { id: 't031', date: '2026-06-08', time: '12:15', amount: 5.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Chicken Rice', merchant: 'Kopitiam', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    { id: 't032', date: '2026-06-08', time: '18:30', amount: 11.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Ramen', merchant: 'Marutama', location: 'The Cathay', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    { id: 't033', date: '2026-06-08', time: '20:00', amount: 500.00, type: 'credit', category: 'Income', subcategory: 'Allowance', description: 'Monthly Allowance', merchant: 'Parents', location: 'Bank Transfer', paymentMethod: 'Bank Transfer', weatherCondition: 'rainy' },
    // Tuesday June 9
    { id: 't034', date: '2026-06-09', time: '08:35', amount: 2.20, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Kopi-O Kosong', merchant: 'Toast Box', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't035', date: '2026-06-09', time: '12:00', amount: 6.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Nasi Lemak', merchant: 'Punggol Nasi Lemak', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't036', date: '2026-06-09', time: '14:00', amount: 2.00, type: 'debit', category: 'Fitness', subcategory: 'Gym', description: 'Gym Entry', merchant: 'ActiveSG Gym', location: 'Clementi Stadium', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't037', date: '2026-06-09', time: '19:00', amount: 8.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Fishball Noodles', merchant: 'Ah Hock', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    // Wednesday June 10
    { id: 't038', date: '2026-06-10', time: '08:25', amount: 2.80, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Cappuccino', merchant: 'PPP Coffee', location: 'Star Vista', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't039', date: '2026-06-10', time: '12:30', amount: 4.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Ban Mian', merchant: 'Qiu Lian', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't040', date: '2026-06-10', time: '15:00', amount: 28.00, type: 'debit', category: 'Shopping', subcategory: 'Skincare', description: 'Innisfree Toner', merchant: 'Innisfree', location: 'Westgate', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't041', date: '2026-06-10', time: '19:30', amount: 20.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Sushi Set', merchant: 'Sushi Tei', location: 'JEM', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    // Thursday June 11
    { id: 't042', date: '2026-06-11', time: '08:40', amount: 2.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Iced Americano', merchant: 'Huggs Coffee', location: 'Clementi MRT', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't043', date: '2026-06-11', time: '12:15', amount: 5.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Chicken Rice', merchant: 'Kopitiam', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't044', date: '2026-06-11', time: '14:00', amount: 2.00, type: 'debit', category: 'Fitness', subcategory: 'Gym', description: 'Gym Entry', merchant: 'ActiveSG Gym', location: 'Clementi Stadium', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't045', date: '2026-06-11', time: '19:00', amount: 7.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Pasta Aglio Olio', merchant: 'Saizeriya', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    // Friday June 12
    { id: 't046', date: '2026-06-12', time: '08:30', amount: 2.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Iced Latte', merchant: 'Starbucks', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't047', date: '2026-06-12', time: '12:00', amount: 6.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Bak Kut Teh', merchant: 'Song Fa', location: 'West Coast', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't048', date: '2026-06-12', time: '16:00', amount: 12.00, type: 'debit', category: 'Education', subcategory: 'Books', description: 'Python Textbook', merchant: 'Kinokuniya', location: 'Takashimaya', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't049', date: '2026-06-12', time: '20:00', amount: 350.00, type: 'credit', category: 'Income', subcategory: 'Part-time', description: 'Tutoring Pay', merchant: 'Student', location: 'Bank Transfer', paymentMethod: 'Bank Transfer', weatherCondition: 'cloudy' },
    // Saturday June 13
    { id: 't050', date: '2026-06-13', time: '09:00', amount: 3.20, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Flat White', merchant: 'Nylon Coffee', location: 'Everton Park', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't051', date: '2026-06-13', time: '10:30', amount: 4.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Breakfast', description: 'Kaya Toast Set', merchant: 'Killiney', location: 'Holland V', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't052', date: '2026-06-13', time: '13:00', amount: 42.00, type: 'debit', category: 'Shopping', subcategory: 'Groceries', description: 'NTUC Weekly Groceries', merchant: 'NTUC FairPrice', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't053', date: '2026-06-13', time: '15:00', amount: 22.00, type: 'debit', category: 'Entertainment', subcategory: 'Escape Room', description: 'Escape Room Entry', merchant: 'Trapped', location: 'Bugis', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't054', date: '2026-06-13', time: '19:30', amount: 25.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'K-BBQ Buffet', merchant: 'Seoul Garden', location: 'Jurong Point', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    // Sunday June 14
    { id: 't055', date: '2026-06-14', time: '10:00', amount: 3.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Cold Brew', merchant: 'PPP Coffee', location: 'Star Vista', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    { id: 't056', date: '2026-06-14', time: '11:00', amount: 14.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Brunch', description: 'Avocado Toast', merchant: 'Group Therapy', location: 'Duxton', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    { id: 't057', date: '2026-06-14', time: '14:00', amount: 18.00, type: 'debit', category: 'Entertainment', subcategory: 'Museum', description: 'ArtScience Museum', merchant: 'Marina Bay Sands', location: 'MBS', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },
    { id: 't058', date: '2026-06-14', time: '18:00', amount: 15.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Burger', merchant: 'Shake Shack', location: 'Jewel', paymentMethod: 'NETS Pay', weatherCondition: 'rainy' },

    // ── WEEK 3: June 15–17 (partial, up to today) ───────────────
    // Monday June 15
    { id: 't059', date: '2026-06-15', time: '08:30', amount: 2.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Iced Latte', merchant: 'Starbucks', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't060', date: '2026-06-15', time: '12:15', amount: 5.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Chicken Rice', merchant: 'Kopitiam', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    { id: 't061', date: '2026-06-15', time: '18:45', amount: 12.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Ramen Set', merchant: 'Ippudo', location: 'Star Vista', paymentMethod: 'NETS Pay', weatherCondition: 'cloudy' },
    // Tuesday June 16
    { id: 't062', date: '2026-06-16', time: '08:35', amount: 2.20, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Kopi-O Kosong', merchant: 'Toast Box', location: 'Clementi Mall', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't063', date: '2026-06-16', time: '12:00', amount: 6.00, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Nasi Lemak', merchant: 'Punggol Nasi Lemak', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't064', date: '2026-06-16', time: '14:00', amount: 2.00, type: 'debit', category: 'Fitness', subcategory: 'Gym', description: 'Gym Entry', merchant: 'ActiveSG Gym', location: 'Clementi Stadium', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't065', date: '2026-06-16', time: '19:00', amount: 8.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Dinner', description: 'Fishball Noodles', merchant: 'Ah Hock', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    // Wednesday June 17 (TODAY)
    { id: 't066', date: '2026-06-17', time: '08:25', amount: 2.80, type: 'debit', category: 'Food & Beverage', subcategory: 'Coffee', description: 'Cappuccino', merchant: 'PPP Coffee', location: 'Star Vista', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't067', date: '2026-06-17', time: '12:30', amount: 4.50, type: 'debit', category: 'Food & Beverage', subcategory: 'Lunch', description: 'Ban Mian', merchant: 'Qiu Lian', location: 'Clementi 448', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't068', date: '2026-06-17', time: '15:00', amount: 32.00, type: 'debit', category: 'Shopping', subcategory: 'Clothing', description: 'Cotton On Tee & Shorts', merchant: 'Cotton On', location: 'Jurong East', paymentMethod: 'NETS Pay', weatherCondition: 'sunny' },
    { id: 't069', date: '2026-06-17', time: '19:30', amount: 200.00, type: 'credit', category: 'Income', subcategory: 'Scholarship', description: 'MOE Scholarship', merchant: 'MOE', location: 'Bank Transfer', paymentMethod: 'Bank Transfer', weatherCondition: 'sunny' },
  ];

  // ─────────────────────────────────────────────────────────────
  // REACTIVE DNA ENGINE (Calvin) — Eron's sync methods below
  // ─────────────────────────────────────────────────────────────

  private txnSubject = new BehaviorSubject<Transaction[]>(this.transactions);

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

  /** Listen to Firestore; switch to seeded data when available */
  private syncFromFirestore(): void {
    const q = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', DEMO_USER_ID)
    );
    onSnapshot(q,
      snapshot => {
        const firestoreTxns = snapshot.docs.map(d => d.data() as Transaction);
        if (firestoreTxns.length > 0) {
          const sorted = [...firestoreTxns].sort(
            (a, b) => (a.date + a.time).localeCompare(b.date + b.time)
          );
          this.transactions = sorted;
          this.txnSubject.next(sorted);
        }
      },
      err => {
        console.warn('[UserDnaService] Firestore read error — using hardcoded transactions:', err?.message ?? err);
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

  /** Returns the current UserDNA snapshot (synchronous). Use dna$ for reactive UI. */
  getUserDNA(): UserDNA {
    return this.computeUserDNA();
  }

  /**
   * Compute full UserDNA from current in-memory transactions.
   *
   * Affinity weight formula (documented here for Eron's reference):
   *   rawScore = 0.5 * freqShare + 0.3 * recencyScore + 0.2 * spendShare
   *   weight   = rawScore / max(rawScore)          ← normalised to 0..1
   *
   * Where:
   *   freqShare     = tag.count / totalTagOccurrences
   *   recencyScore  = e^(-0.05 * daysSinceLastSeen)   (half-life ≈ 14 days)
   *   spendShare    = tag.totalSpend / totalTagSpend
   */
  computeUserDNA(): UserDNA {
    const all    = this.txnSubject.getValue();
    const debits = all.filter(t => t.type === 'debit' && t.amount > 0);
    const credits = all.filter(t => t.type === 'credit');

    const totalSpent  = debits.reduce((s, t) => s + t.amount, 0);
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
      const freqShare    = totalTagCount > 0 ? v.count / totalTagCount : 0;
      const daysSince    = Math.max(0,
        (new Date(today).getTime() - new Date(v.lastSeen).getTime()) / 86_400_000);
      const recencyScore = Math.exp(-0.05 * daysSince);
      const spendShare   = totalTagSpend > 0 ? v.spend / totalTagSpend : 0;
      rawScores.set(tag, 0.5 * freqShare + 0.3 * recencyScore + 0.2 * spendShare);
    });

    const maxRaw = Math.max(0, ...rawScores.values());
    const affinityVector: TagAffinity[] = [];
    tagMap.forEach((v, tag) => {
      affinityVector.push({
        tag,
        weight:     maxRaw > 0 ? Math.round((rawScores.get(tag)! / maxRaw) * 1000) / 1000 : 0,
        count:      v.count,
        totalSpend: Math.round(v.spend * 100) / 100,
        lastSeen:   v.lastSeen,
      });
    });
    affinityVector.sort((a, b) => b.weight - a.weight);

    const personas = this.derivePersonas(affinityVector);

    return {
      userId: DEMO_USER_ID,
      generatedAt: new Date().toISOString(),
      totals: {
        spent:    Math.round(totalSpent  * 100) / 100,
        income:   Math.round(totalIncome * 100) / 100,
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
   * Contains affinityVector + merchant tag catalogue.
   * No similarity scores or location logic — that's Eron's side.
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
      return new Date(t.date + 'T00:00:00').getDay() === dayOfWeek;
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

  /** Compare same weekday across weeks */
  getSameDayComparison(targetDate: string): { sameDayLastWeek: string; avgSpent: number; trend: 'up' | 'down' | 'stable' } {
    const target = new Date(targetDate + 'T00:00:00');
    const dow = target.getDay();
    const sameDayTxs = this.transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getDay() === dow && t.date !== targetDate && t.type === 'debit';
    });

    const avgSpent = sameDayTxs.length > 0
      ? sameDayTxs.reduce((a, t) => a + t.amount, 0) / sameDayTxs.length
      : 0;

    // Find last occurrence of same weekday
    const lastWeek = new Date(target);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];
    const lastWeekTxs = this.transactions.filter(t => t.date === lastWeekStr && t.type === 'debit');
    const lastWeekTotal = lastWeekTxs.reduce((a, t) => a + t.amount, 0);

    const targetTxs = this.transactions.filter(t => t.date === targetDate && t.type === 'debit');
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
    const debits = this.transactions.filter(t => t.type === 'debit');
    const credits = this.transactions.filter(t => t.type === 'credit');
    return {
      totalSpent: debits.reduce((a, t) => a + t.amount, 0),
      totalIncome: credits.reduce((a, t) => a + t.amount, 0),
      transactionCount: this.transactions.length,
      avgTransaction: debits.length > 0 ? debits.reduce((a, t) => a + t.amount, 0) / debits.length : 0
    };
  }

  getCategoryBreakdown() {
    const map = new Map<string, number>();
    this.transactions.filter(t => t.type === 'debit').forEach(t => {
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
    addExternalTransaction(partial: any): void {
    const txn: Transaction = {
      id: `ext-${Date.now()}`,
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
      merchantId: partial.merchantId || null
    };

    this.transactions.push(txn);
    this.transactions.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    this.txnSubject.next([...this.transactions]);
  }
}
