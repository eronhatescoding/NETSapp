import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { UserDnaService } from '../../data/user-dna.service';
import { DEMO_USER_ID } from '../../data/seed.service';
import { MERCHANT_CATALOGUE } from '../../data/merchant-catalogue';
import { Merchant } from '../../models/transaction.model';

type Phase = 'selecting' | 'confirming' | 'paying' | 'success';

@Component({
  selector: 'app-pay',
  templateUrl: './pay.page.html',
  styleUrls: ['./pay.page.scss'],
  standalone: false,
})
export class PayPage {
  phase: Phase = 'selecting';
  searchQuery = '';
  selectedMerchant: Merchant | null = null;
  amountStr = '';
  isSubmitting = false;
  lastTxn: { merchant: string; amount: number; time: string } | null = null;

  readonly catalogue = MERCHANT_CATALOGUE;

  constructor(
    private userDnaService: UserDnaService,
    private toastCtrl: ToastController,
  ) {}

  // ── Derived state ─────────────────────────────────────────────

  get filteredMerchants(): Merchant[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.catalogue;
    return this.catalogue.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  }

  get groupedMerchants(): { category: string; merchants: Merchant[] }[] {
    const map = new Map<string, Merchant[]>();
    for (const m of this.filteredMerchants) {
      const arr = map.get(m.category) ?? [];
      arr.push(m);
      map.set(m.category, arr);
    }
    return Array.from(map.entries()).map(([category, merchants]) => ({ category, merchants }));
  }

  get parsedAmount(): number {
    return Math.round(parseFloat(this.amountStr) * 100) / 100;
  }

  get amountError(): string {
    if (!this.amountStr.trim()) return '';
    const n = this.parsedAmount;
    if (isNaN(n)) return 'Enter a valid amount';
    if (n <= 0)   return 'Amount must be greater than $0.00';
    if (n > 9999) return 'Amount cannot exceed $9,999.00';
    return '';
  }

  get canPay(): boolean {
    const n = this.parsedAmount;
    return (
      !!this.selectedMerchant &&
      this.amountStr.trim() !== '' &&
      !isNaN(n) && n > 0 && n <= 9999 &&
      !this.isSubmitting
    );
  }

  // ── Actions ───────────────────────────────────────────────────

  selectMerchant(merchant: Merchant) {
    this.selectedMerchant = merchant;
    this.amountStr = merchant.typicalAmount.toFixed(2);
    this.searchQuery = '';
    this.phase = 'confirming';
  }

  backToSelect() {
    this.selectedMerchant = null;
    this.amountStr = '';
    this.phase = 'selecting';
  }

  async pay() {
    // Double-submit guard — reject if already in flight
    if (!this.canPay || !this.selectedMerchant || this.isSubmitting) return;

    this.isSubmitting = true;
    this.phase = 'paying';

    const now     = new Date();
    const date    = now.toISOString().split('T')[0];
    const time    = now.toTimeString().slice(0, 5);
    const amount  = this.parsedAmount;
    const merchant = this.selectedMerchant;

    try {
      await this.userDnaService.addTransaction({
        userId: DEMO_USER_ID,
        date,
        time,
        // Round to 2 dp; stored as number, not string
        amount,
        type: 'debit',
        category: merchant.category,
        subcategory: this.deriveSubcategory(merchant),
        description: merchant.name,
        merchant: merchant.name,
        merchantId: merchant.id,
        tags: [...merchant.tags],
        paymentMethod: 'NETS Pay',
      });

      this.lastTxn = { merchant: merchant.name, amount, time };
      this.phase = 'success';
    } catch (err: any) {
      // Firestore write failed — log full error, roll back to confirming
      console.error('[Pay] Firestore write failed:', err?.message ?? err);
      this.phase = 'confirming';
      const toast = await this.toastCtrl.create({
        message: 'Payment failed — please try again.',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    } finally {
      this.isSubmitting = false;
    }
  }

  reset() {
    this.phase = 'selecting';
    this.selectedMerchant = null;
    this.amountStr = '';
    this.lastTxn = null;
    this.searchQuery = '';
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Food & Beverage':     'restaurant-outline',
      Shopping:              'bag-outline',
      Entertainment:         'film-outline',
      Fitness:               'barbell-outline',
      Education:             'book-outline',
      Transport:             'car-outline',
      'Lifestyle & Services':'phone-portrait-outline',
    };
    return icons[category] ?? 'grid-outline';
  }

  private deriveSubcategory(m: Merchant): string {
    if (m.tags.includes('fnb:coffee'))     return 'Coffee';
    if (m.tags.includes('fnb:bubbletea')) return 'Bubble Tea';
    if (m.tags.includes('fnb:fastfood'))  return 'Fast Food';
    if (m.tags.includes('fnb:japanese'))  return 'Japanese';
    if (m.tags.includes('fnb:korean'))    return 'Korean';
    if (m.tags.includes('fnb:western'))   return 'Western';
    if (m.tags.includes('fnb:lunch'))     return 'Lunch';
    if (m.tags.includes('fnb:dinner'))    return 'Dinner';
    if (m.category === 'Fitness')               return 'Gym';
    if (m.category === 'Entertainment')         return 'Entertainment';
    if (m.category === 'Shopping')              return 'Shopping';
    if (m.category === 'Education')             return 'Education';
    if (m.category === 'Transport')             return 'Transport';
    if (m.category === 'Lifestyle & Services')  return 'Subscriptions';
    return m.category;
  }
}
