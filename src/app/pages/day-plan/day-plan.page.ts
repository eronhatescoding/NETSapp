import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { DayPlan, PlannedActivity, PlannedAlternative } from '../../models/day-plan.model';
import { DayPlanService } from '../../data/day-plan.service';

@Component({
  selector: 'app-day-plan',
  templateUrl: './day-plan.page.html',
  styleUrls: ['./day-plan.page.scss'],
  standalone: false,
})
export class DayPlanPage implements OnInit {
  date: string = '';
  plan: DayPlan | null = null;
  selectedItem: PlannedActivity | null = null;
  showAltModal: boolean = false;

  weatherIcons: Record<string, string> = {
    sunny: 'sunny', rainy: 'rainy', cloudy: 'cloudy', stormy: 'thunderstorm'
  };

  constructor(
    private route: ActivatedRoute,
    private dayPlanService: DayPlanService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.date = this.route.snapshot.paramMap.get('date') || '';
    if (this.date) this.plan = this.dayPlanService.generateDayPlan(this.date);
  }

  getWeatherIcon(c: string): string { return this.weatherIcons[c] || 'cloudy'; }

  getConfidenceColor(c: number): string {
    if (c >= 90) return 'success';
    if (c >= 70) return 'primary';
    if (c >= 50) return 'warning';
    return 'medium';
  }

  getPatternSourceLabel(s: string): string {
    const labels: Record<string, string> = {
      daily_streak: 'Daily Streak',
      weekly_pattern: 'Weekly Pattern',
      weather_adapted: 'Weather Adapted',
      trending: 'Trending',
      fallback: 'Smart Suggestion'
    };
    return labels[s] || s;
  }

  getPatternSourceColor(s: string): string {
    const colors: Record<string, string> = {
      daily_streak: 'danger',
      weekly_pattern: 'primary',
      weather_adapted: 'warning',
      trending: 'tertiary',
      fallback: 'medium'
    };
    return colors[s] || 'medium';
  }

  getPatternSourceIcon(s: string): string {
    const icons: Record<string, string> = {
      daily_streak: 'flame',
      weekly_pattern: 'calendar',
      weather_adapted: 'cloudy',
      trending: 'trending-up',
      fallback: 'bulb'
    };
    return icons[s] || 'help-circle';
  }

  openAlternatives(a: PlannedActivity) {
    this.selectedItem = a;
    this.showAltModal = true;
  }

  closeAltModal() {
    this.showAltModal = false;
    this.selectedItem = null;
  }

  getMinCost(alts: PlannedAlternative[]): number {
    if (!alts || alts.length === 0) return 0;
    return Math.min(...alts.map(a => a.estimatedCost));
  }

  getSavings(activity: PlannedActivity): number {
    return activity.estimatedCost - this.getMinCost(activity.alternatives);
  }

  async addToCalendar(activity: PlannedActivity) {
    this.closeAltModal();
    const toast = await this.toastController.create({
      message: `${activity.title} added to calendar`,
      duration: 2000,
      color: 'primary',
      position: 'bottom',
      cssClass: 'nets-toast'
    });
    await toast.present();
  }

  async addWholePlan() {
    const toast = await this.toastController.create({
      message: 'Full day plan added to calendar',
      duration: 2000,
      color: 'primary',
      position: 'bottom',
      cssClass: 'nets-toast'
    });
    await toast.present();
  }
}
