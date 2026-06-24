import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { UserDnaService } from '../../data/user-dna.service';
import { UserDNA, SpendingPattern } from '../../models/transaction.model';
import { MERCHANT_BY_ID } from '../../data/merchant-catalogue';
import { WrappedComponent } from '../wrapped/wrapped.component';

@Component({
  selector: 'app-insights',
  templateUrl: './insights.page.html',
  styleUrls: ['./insights.page.scss'],
  standalone: false,
})
export class InsightsPage implements OnInit {
  dna$!: Observable<UserDNA>;
  patterns: SpendingPattern[] = [];

  constructor(
    private userDnaService: UserDnaService,
    private router: Router,
    private modalCtrl: ModalController,
  ) {}

  ngOnInit() {
    this.dna$ = this.userDnaService.dna$;
    this.patterns = this.userDnaService.detectPatterns().slice(0, 4);
  }

  goToSettings() {
    this.router.navigate(['/tabs/settings']);
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

  formatTag(tag: string): string {
    return TAG_DISPLAY[tag] ?? tag.split(':')[1]?.replace(/([a-z])([A-Z])/g, '$1 $2') ?? tag;
  }

  getPatternIcon(subcategory?: string): string {
    const icons: Record<string, string> = {
      Coffee: 'cafe', Gym: 'barbell', Lunch: 'fast-food',
      Dinner: 'restaurant', Movies: 'film', Shopping: 'bag',
      Streaming: 'tv', Brunch: 'restaurant', 'Bubble Tea': 'cafe',
      Groceries: 'cart',
    };
    return icons[subcategory ?? ''] ?? 'analytics';
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Food & Beverage': 'restaurant-outline',
      Shopping: 'bag-outline',
      Entertainment: 'film-outline',
      Fitness: 'barbell-outline',
      Education: 'book-outline',
      Transport: 'car-outline',
      'Lifestyle & Services': 'phone-portrait-outline',
    };
    return icons[category] ?? 'grid-outline';
  }
}

const TAG_DISPLAY: Record<string, string> = {
  'fnb:bubbletea':     'Bubble Tea',
  'fnb:coffee':        'Coffee',
  'fnb:lunch':         'Lunch',
  'fnb:dinner':        'Dinner',
  'fnb:breakfast':     'Breakfast',
  'fnb:supper':        'Supper',
  'fnb:brunch':        'Brunch',
  'fnb:fastfood':      'Fast Food',
  'fnb:hawker':        'Hawker',
  'fnb:foodcourt':     'Food Court',
  'fnb:cafe':          'Cafe',
  'fnb:restaurant':    'Restaurant',
  'fnb:japanese':      'Japanese',
  'fnb:korean':        'Korean',
  'fnb:western':       'Western',
  'fnb:chinese':       'Chinese',
  'fnb:malay':         'Malay',
  'fnb:juice':         'Drinks',
  'shopping:fashion':  'Fashion',
  'shopping:beauty':   'Beauty',
  'shopping:electronics': 'Electronics',
  'shopping:groceries':'Groceries',
  'shopping:convenience': 'Convenience',
  'shopping:lifestyle':'Lifestyle',
  'ent:cinema':        'Cinema',
  'ent:arcade':        'Arcade',
  'ent:ktv':           'KTV',
  'ent:gaming':        'Gaming',
  'ent:nightlife':     'Nightlife',
  'fit:gym':           'Gym',
  'fit:yoga':          'Yoga',
  'fit:studio':        'Fitness Studio',
  'fit:climbing':      'Climbing',
  'fit:sports':        'Sports',
  'edu:books':         'Books',
  'edu:stationery':    'Stationery',
  'edu:courses':       'Courses',
  'trn:ridehailing':   'Ride-Hailing',
  'trn:transit':       'Public Transit',
  'trn:fuel':          'Fuel',
  'lst:subscription':  'Subscriptions',
  'lst:telco':         'Telco',
  'lst:wellness':      'Wellness',
};
