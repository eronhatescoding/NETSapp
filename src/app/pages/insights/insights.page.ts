import { Component, OnInit } from '@angular/core';
import { UserDnaService } from '../../data/user-dna.service';
import { SpendingPattern } from '../../models/transaction.model';

@Component({
  selector: 'app-insights',
  templateUrl: './insights.page.html',
  styleUrls: ['./insights.page.scss'],
  standalone: false,
})
export class InsightsPage implements OnInit {
  patterns: SpendingPattern[] = [];
  monthStats: any;
  categoryBreakdown: any[] = [];

  constructor(private userDnaService: UserDnaService) { }

  ngOnInit() {
    this.patterns = this.userDnaService.detectPatterns();
    this.monthStats = this.userDnaService.getMonthStats();
    this.categoryBreakdown = this.userDnaService.getCategoryBreakdown();
  }

  getPatternIcon(subcategory: string | undefined): string {
    const icons: Record<string, string> = {
      'Coffee': 'cafe', 'Gym': 'barbell', 'Lunch': 'fast-food',
      'Dinner': 'restaurant', 'Movies': 'film', 'Shopping': 'bag',
      'Streaming': 'tv', 'Brunch': 'restaurant', 'Park': 'flower'
    };
    return icons[subcategory || ''] || 'analytics';
  }

  getWeatherIcon(preference: string | undefined): string {
    const map: Record<string, string> = { 'outdoor': 'sunny', 'indoor': 'home', 'dry': 'partly-sunny', 'any': 'cloudy' };
    return map[preference || 'any'] || 'cloudy';
  }
  min(val: number, max: number): number {
    return Math.min(val, max);
  } 
}
