import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Transaction } from '../../models/transaction.model';
import { UserDnaService } from '../../data/user-dna.service';

@Component({
  selector: 'app-transaction-detail',
  templateUrl: './transaction-detail.page.html',
  styleUrls: ['./transaction-detail.page.scss'],
  standalone: false,
})
export class TransactionDetailPage implements OnInit {
  transaction: Transaction | undefined;

  constructor(
    private route: ActivatedRoute,
    private userDnaService: UserDnaService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.transaction = this.userDnaService.getTransactionById(id);
  }

  getTransactionIcon(category: string): string {
    const icons: Record<string, string> = {
      'Food & Beverage': 'restaurant', 'Transport': 'bus',
      'Entertainment': 'film', 'Fitness': 'barbell',
      'Shopping': 'bag', 'Education': 'school', 'Income': 'cash'
    };
    return icons[category] || 'card';
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Food & Beverage': 'restaurant-outline',
      'Transport':       'car-outline',
      'Entertainment':   'film-outline',
      'Fitness':         'barbell-outline',
      'Shopping':        'bag-handle-outline',
      'Education':       'book-outline',
      'Income':          'cash-outline',
      'Lifestyle & Services': 'sparkles-outline',
    };
    return icons[category] || 'grid-outline';
  }

  getInsightText(): string {
    if (!this.transaction) return '';
    const t = this.transaction;
    let text = `This ${t.category.toLowerCase()} purchase is ${t.amount > 20 ? 'above' : 'within'} your typical spending range.`;
    if (t.subcategory === 'Coffee') text += ' You have a strong coffee habit — consider a monthly subscription for savings.';
    if (t.category === 'Fitness') text += ' Great consistency! You have been maintaining your gym routine for 3 weeks.';
    if (t.category === 'Shopping' && t.amount > 30) text += ' This is above your usual shopping amount. Consider if this is a need or want.';
    return text;
  }
}
