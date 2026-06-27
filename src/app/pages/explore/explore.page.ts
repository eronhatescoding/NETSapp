import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Event, Activity } from '../../models/explore.model';
import { ExploreDataService } from '../../data/explore-data.service';
import { UserDnaService } from '../../data/user-dna.service';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: false,
})
export class ExplorePage {
  activeTab: 'events' | 'activities' = 'events';
  searchText: string = '';
  selectedEvent: Event | null = null;
  showEventModal: boolean = false;

  // Loading state
  loading$: Observable<boolean>;

  // Filtered scored data
  filteredEvents$: Observable<Event[]>;
  filteredActivities$: Observable<Activity[]>;

  constructor(
    private exploreDataService: ExploreDataService,
    private userDnaService: UserDnaService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.loading$ = this.exploreDataService.loading$;

    // Combine scored events with search filter
    this.filteredEvents$ = combineLatest([
      this.exploreDataService.scoredEvents$,
      this.exploreDataService.loading$
    ]).pipe(
      map(([events, loading]) => {
        if (loading) return [];
        const q = this.searchText.toLowerCase().trim();
        if (!q) return events;
        return events.filter(e =>
          e.title.toLowerCase().includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q))
        );
      })
    );

    // Combine scored activities with search filter
    this.filteredActivities$ = combineLatest([
      this.exploreDataService.scoredActivities$,
      this.exploreDataService.loading$
    ]).pipe(
      map(([activities, loading]) => {
        if (loading) return [];
        const q = this.searchText.toLowerCase().trim();
        if (!q) return activities;
        return activities.filter(a =>
          a.title.toLowerCase().includes(q) ||
          a.tags.some(t => t.toLowerCase().includes(q))
        );
      })
    );
  }

  onSearchChange() {
    // Triggered by (ionChange) — the combineLatest pipes re-filter automatically
  }

  getTasteColor(match: number): string {
    return this.exploreDataService.getTasteColor(match);
  }

  getTasteMatchReason(event: Event): string {
    return event.matchReason || 'Based on your spending DNA';
  }

  openEvent(event: Event) {
    this.selectedEvent = event;
    this.showEventModal = true;
  }

  closeEventModal() {
    this.showEventModal = false;
    this.selectedEvent = null;
  }

  async addToCalendar() {
    if (!this.selectedEvent) return;
    
    // Capture event before closing modal
    const event = this.selectedEvent;
    this.closeEventModal();
    
    // Create a prediction for this event
    const eventDate = this.parseEventDate(event.date);
    if (eventDate) {
      this.userDnaService.addExternalTransaction({
        id: `event-${event.id}`,
        date: eventDate,
        time: '19:00',
        amount: event.price || 0,
        type: 'debit',
        category: 'Entertainment',
        subcategory: event.category,
        description: event.title,
        merchant: event.venue,
        tags: event.tags
      });
    }

    const toast = await this.toastController.create({
      message: 'Added to your calendar as a prediction!',
      duration: 2000,
      color: 'primary',
      position: 'bottom',
      cssClass: 'nets-toast'
    });
    await toast.present();
  }

  async buyTicket() {
    if (!this.selectedEvent) return;
    
    // Capture event before closing modal
    const event = this.selectedEvent;
    this.closeEventModal();
    
    // Simulate NETS Pay purchase
    const eventDate = this.parseEventDate(event.date);
    if (eventDate) {
      this.userDnaService.addExternalTransaction({
        id: `ticket-${event.id}`,
        date: eventDate,
        time: '19:00',
        amount: event.price || 0,
        type: 'debit',
        category: 'Entertainment',
        subcategory: event.category,
        description: `Ticket: ${event.title}`,
        merchant: event.venue,
        tags: [...event.tags, 'purchase:confirmed']
      });
    }

    const toast = await this.toastController.create({
      message: `Ticket purchased! $${event.price} paid via NETS Pay.`,
      duration: 2500,
      color: 'success',
      position: 'bottom',
      cssClass: 'nets-toast'
    });
    await toast.present();
  }

  private parseEventDate(dateStr: string): string | null {
    // Extract date from relative format like "This Saturday, 28 Jun"
    // Fallback: use today + 7 days
    const match = dateStr.match(/\d{1,2}\s+[A-Za-z]{3}/);
    if (match) {
      const now = new Date();
      const year = now.getFullYear();
      return `${year}-${this.monthToNum(match[0].split(' ')[1])}-${match[0].split(' ')[0].padStart(2, '0')}`;
    }
    // Fallback: next Saturday
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  private monthToNum(month: string): string {
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    return months[month] || '06';
  }
  refresh() {
    this.exploreDataService.refreshEvents();
  }
  
  selectedActivity: Activity | null = null;
  showActivityModal: boolean = false;

  openActivity(activity: Activity) {
    this.selectedActivity = activity;
    this.showActivityModal = true;
  }

  closeActivityModal() {
    this.showActivityModal = false;
    this.selectedActivity = null;
  }
}