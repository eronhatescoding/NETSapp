import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { UserDnaService } from '../../data/user-dna.service';
import { UserDNA, Persona } from '../../models/transaction.model';
import { MERCHANT_BY_ID } from '../../data/merchant-catalogue';
import { WrappedComponent } from '../wrapped/wrapped.component';
import { ExploreDataService } from '../../data/explore-data.service';
import { Event as ExploreEvent } from '../../models/explore.model';

@Component({
  selector: 'app-insights',
  templateUrl: './insights.page.html',
  styleUrls: ['./insights.page.scss'],
  standalone: false,
})
export class InsightsPage implements OnInit, OnDestroy {
  dna$!: Observable<UserDNA>;

  /** Top DNA-matched Explore item — reuses Eron's existing scoring, read-only */
  topMatch$!: Observable<ExploreEvent | null>;

  /** Persona popup state */
  showPersonaModal = false;
  selectedPersona: Persona | null = null;

  /** Category drill-down state */
  expandedCategories = new Set<string>();
  categoryMerchantMap = new Map<string, { merchantId: string; name: string; count: number; spend: number }[]>();

  private subs: Subscription[] = [];

  constructor(
    private userDnaService: UserDnaService,
    private exploreDataService: ExploreDataService,
    private router: Router,
    private modalCtrl: ModalController,
  ) {}

  ngOnInit() {
    this.dna$ = this.userDnaService.dna$;

    // Take the #1 scored event from Eron's pipeline (no new matching logic)
    this.topMatch$ = combineLatest([
      this.exploreDataService.scoredEvents$,
      this.exploreDataService.loading$,
    ]).pipe(
      map(([events, isLoading]) => (!isLoading && events.length > 0) ? events[0] : null)
    );

    // Build category→merchants map now and keep it fresh after each payment
    this.buildCategoryMerchantMap();
    this.subs.push(
      this.userDnaService.transactions$.subscribe(() => this.buildCategoryMerchantMap())
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  goToSettings() {
    this.router.navigate(['/tabs/settings']);
  }

  goToExplore() {
    this.router.navigate(['/tabs/explore']);
  }

  // ── Persona showcase ────────────────────────────────────────────

  openPersona(persona: Persona) {
    this.selectedPersona = persona;
    this.showPersonaModal = true;
  }

  closePersonaModal() {
    this.showPersonaModal = false;
    this.selectedPersona = null;
  }

  getPersonaIcon(id: string): string {
    return PERSONA_ICONS[id] ?? 'person-outline';
  }

  /** Called by (error) on persona img — hides broken image, revealing placeholder */
  hidePersonaImage(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  async openWrapped() {
    const dna = this.userDnaService.getUserDNA();
    const modal = await this.modalCtrl.create({
      component: WrappedComponent,
      componentProps: { dna },
      cssClass: 'wrapped-modal',
    });
    await modal.present();
  }

  getMerchantIcon(merchantId: string): string {
    return MERCHANT_BY_ID.get(merchantId)?.icon || 'storefront-outline';
  }

  /** Friendly label for any affinity tag — no raw tags shown in UI */
  formatTag(tag: string): string {
    if (TAG_DISPLAY[tag]) return TAG_DISPLAY[tag];
    const sub = tag.split(':')[1] ?? tag;
    return sub.charAt(0).toUpperCase() + sub.slice(1);
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Food & Beverage': 'restaurant-outline',
      Shopping:          'bag-outline',
      Entertainment:     'film-outline',
      Fitness:           'barbell-outline',
      Education:         'book-outline',
      Transport:         'car-outline',
      'Lifestyle & Services': 'phone-portrait-outline',
    };
    return icons[category] ?? 'grid-outline';
  }

  /** Bar width % for the merchant chart — max-count bar = 100%, others proportional */
  getMerchantBarPct(count: number, dna: UserDNA): number {
    const max = dna.topMerchants[0]?.count ?? 1;
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  // ── Category drill-down ─────────────────────────────────────────

  toggleCategory(category: string) {
    if (this.expandedCategories.has(category)) {
      this.expandedCategories.delete(category);
    } else {
      this.expandedCategories.add(category);
    }
  }

  isCategoryExpanded(category: string): boolean {
    return this.expandedCategories.has(category);
  }

  getMerchantsForCategory(category: string): { merchantId: string; name: string; count: number; spend: number }[] {
    return this.categoryMerchantMap.get(category) ?? [];
  }

  /**
   * Groups all real debit transactions by category → merchant,
   * counting visits and summing spend. Read-only — does not touch the service computation.
   */
  private buildCategoryMerchantMap(): void {
    const txns = this.userDnaService.getAllTransactions()
      .filter(t => t.type === 'debit' && !t.isPlanned);

    const catMap = new Map<string, Map<string, { name: string; count: number; spend: number }>>();
    for (const t of txns) {
      const mid = t.merchantId || t.merchant || 'unknown';
      const name = t.merchant || mid;
      if (!catMap.has(t.category)) catMap.set(t.category, new Map());
      const mMap = catMap.get(t.category)!;
      const m = mMap.get(mid) || { name, count: 0, spend: 0 };
      m.count++;
      m.spend += t.amount;
      mMap.set(mid, m);
    }

    this.categoryMerchantMap.clear();
    catMap.forEach((mMap, cat) => {
      const sorted = Array.from(mMap.entries())
        .map(([mid, m]) => ({
          merchantId: mid,
          name: m.name,
          count: m.count,
          spend: Math.round(m.spend * 100) / 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      this.categoryMerchantMap.set(cat, sorted);
    });
  }
}

// ── Persona icon registry — one ionicon per persona id ────────────
const PERSONA_ICONS: Record<string, string> = {
  'bubbletea-royalty': 'cafe-outline',
  'hawker-regular':    'restaurant-outline',
  'cafe-dweller':      'cafe-outline',
  'cinema-hopper':     'film-outline',
  'fitness-junkie':    'barbell-outline',
  'fashion-forward':   'bag-outline',
  'tech-enthusiast':   'laptop-outline',
  'foodie-explorer':   'earth-outline',
  'night-owl':         'moon-outline',
  'bookworm':          'book-outline',
  'fast-food-fan':     'fast-food-outline',
  'grocery-guru':      'cart-outline',
};

// ── Full tag → friendly label map (all 43 taxonomy tags) ──────────
const TAG_DISPLAY: Record<string, string> = {
  // Food & Beverage
  'fnb:breakfast':  'Breakfast',
  'fnb:lunch':      'Lunch',
  'fnb:dinner':     'Dinner',
  'fnb:supper':     'Supper',
  'fnb:brunch':     'Brunch',
  'fnb:bubbletea':  'Bubble Tea',
  'fnb:coffee':     'Coffee',
  'fnb:juice':      'Drinks',
  'fnb:chinese':    'Chinese',
  'fnb:western':    'Western',
  'fnb:japanese':   'Japanese',
  'fnb:korean':     'Korean',
  'fnb:malay':      'Malay',
  'fnb:indian':     'Indian',
  'fnb:thai':       'Thai',
  'fnb:fastfood':   'Fast Food',
  'fnb:hawker':     'Hawker',
  'fnb:foodcourt':  'Food Court',
  'fnb:cafe':       'Cafe',
  'fnb:restaurant': 'Restaurant',
  // Shopping
  'shopping:fashion':     'Fashion',
  'shopping:beauty':      'Beauty',
  'shopping:electronics': 'Electronics',
  'shopping:groceries':   'Groceries',
  'shopping:convenience': 'Convenience',
  'shopping:lifestyle':   'Lifestyle',
  // Entertainment
  'ent:cinema':     'Cinema',
  'ent:arcade':     'Arcade',
  'ent:ktv':        'KTV',
  'ent:gaming':     'Gaming',
  'ent:liveevents': 'Live Events',
  'ent:nightlife':  'Nightlife',
  'ent:museum':     'Museum',
  'ent:bowling':    'Bowling',
  'ent:escaperoom': 'Escape Room',
  // Fitness
  'fit:gym':      'Gym',
  'fit:studio':   'Fitness Studio',
  'fit:sports':   'Sports',
  'fit:climbing': 'Climbing',
  'fit:yoga':     'Yoga',
  // Education
  'edu:books':      'Books',
  'edu:courses':    'Courses',
  'edu:stationery': 'Stationery',
  // Transport
  'trn:ridehailing': 'Ride-Hailing',
  'trn:transit':     'Public Transit',
  'trn:fuel':        'Fuel',
  // Lifestyle & Services
  'lst:telco':        'Telco',
  'lst:subscription': 'Subscriptions',
  'lst:wellness':     'Wellness',
};
