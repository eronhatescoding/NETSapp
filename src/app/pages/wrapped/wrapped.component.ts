import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UserDNA, TagAffinity, Persona } from '../../models/transaction.model';

interface WrappedCard {
  type: string;
}

@Component({
  selector: 'app-wrapped',
  templateUrl: './wrapped.component.html',
  styleUrls: ['./wrapped.component.scss'],
  standalone: false,
})
export class WrappedComponent implements OnInit {
  @Input() dna!: UserDNA;

  currentIdx = 0;
  cards: WrappedCard[] = [];
  year = new Date().getFullYear();

  private touchStartX = 0;
  private hasSwiped = false;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.buildCards();
  }

  private buildCards() {
    this.cards = [{ type: 'intro' }, { type: 'spending' }, { type: 'txn-count' }];
    if (this.dna.categoryBreakdown.length > 0) this.cards.push({ type: 'top-category' });
    if (this.dna.topMerchants.length > 0)       this.cards.push({ type: 'top-merchant' });
    if (this.dna.affinityVector.length > 0)      this.cards.push({ type: 'top-tag' });
    if (this.dna.personas.length > 0)            this.cards.push({ type: 'persona' });
    this.cards.push({ type: 'summary' });
  }

  // ── Data accessors ──────────────────────────────────────────────

  get topCategory() { return this.dna.categoryBreakdown[0]; }
  get topMerchant() { return this.dna.topMerchants[0]; }
  get topTag(): TagAffinity | null { return this.dna.affinityVector[0] ?? null; }
  get topPersona(): Persona | null { return this.dna.personas[0] ?? null; }
  get allPersonas(): Persona[] { return this.dna.personas.slice(0, 3); }

  get txnTagline(): string {
    const n = this.dna.totals.txnCount;
    if (n > 100) return 'You really love NETS 🔥';
    if (n > 50)  return 'You\'re on a roll';
    if (n > 20)  return 'Getting started!';
    return 'Every tap counts';
  }

  // ── Navigation ──────────────────────────────────────────────────

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
    this.hasSwiped = false;
  }

  onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(dx) > 50) {
      this.hasSwiped = true;
      if (dx < 0) this.next();
      else this.prev();
    }
  }

  onTap(e: MouseEvent) {
    if (this.hasSwiped) { this.hasSwiped = false; return; }
    const el = e.target as HTMLElement;
    if (el.closest('.w-close-btn') || el.closest('.sum-close-btn')) return;
    if (e.clientX < window.innerWidth / 2) this.prev();
    else this.next();
  }

  next() { if (this.currentIdx < this.cards.length - 1) this.currentIdx++; }
  prev() { if (this.currentIdx > 0) this.currentIdx--; }
  close() { this.modalCtrl.dismiss(); }

  // ── Style helpers ────────────────────────────────────────────────

  getCardStyle(card: WrappedCard): { [key: string]: string } {
    return { background: this.getCardBg(card) };
  }

  private getCardBg(card: WrappedCard): string {
    const G: Record<string, string> = {
      'intro':        'linear-gradient(160deg, #011835 0%, #003380 100%)',
      'spending':     'linear-gradient(160deg, #EA0029 0%, #9B0018 100%)',
      'txn-count':    'linear-gradient(160deg, #7C3AED 0%, #4C1D95 100%)',
      'top-category': 'linear-gradient(160deg, #D97706 0%, #92400E 100%)',
      'top-merchant': 'linear-gradient(160deg, #0057B8 0%, #003A80 100%)',
      'top-tag':      'linear-gradient(160deg, #0D9488 0%, #134E4A 100%)',
      'summary':      'linear-gradient(160deg, #011835 0%, #1E293B 100%)',
    };
    if (card.type === 'persona' && this.topPersona) {
      return this.personaGradient(this.topPersona.color);
    }
    return G[card.type] ?? '#011835';
  }

  private personaGradient(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dark = `rgb(${Math.floor(r * 0.5)},${Math.floor(g * 0.5)},${Math.floor(b * 0.5)})`;
    return `linear-gradient(160deg, ${hex} 0%, ${dark} 100%)`;
  }

  // ── Format helpers ───────────────────────────────────────────────

  formatTagName(tag: string): string {
    const M: Record<string, string> = {
      'fnb:bubbletea':      'Bubble Tea',
      'fnb:coffee':         'Coffee',
      'fnb:hawker':         'Hawker Food',
      'fnb:fastfood':       'Fast Food',
      'fnb:japanese':       'Japanese',
      'fnb:korean':         'Korean',
      'fnb:cafe':           'Café',
      'fnb:lunch':          'Lunch',
      'fnb:dinner':         'Dinner',
      'fnb:breakfast':      'Breakfast',
      'fnb:supper':         'Supper',
      'shopping:fashion':   'Fashion',
      'shopping:electronics':'Electronics',
      'shopping:groceries': 'Groceries',
      'ent:cinema':         'Cinema',
      'ent:gaming':         'Gaming',
      'ent:ktv':            'KTV',
      'fit:gym':            'Gym',
      'fit:yoga':           'Yoga',
      'lst:subscription':   'Subscriptions',
    };
    return M[tag] ?? tag.split(':')[1]?.replace(/-/g, ' ') ?? tag;
  }

  getCategoryEmoji(category: string): string {
    const M: Record<string, string> = {
      'Food & Beverage':     '🍽️',
      Shopping:              '🛍️',
      Entertainment:         '🎬',
      Fitness:               '💪',
      Education:             '📚',
      Transport:             '🚌',
      'Lifestyle & Services':'✨',
    };
    return M[category] ?? '💰';
  }
}
