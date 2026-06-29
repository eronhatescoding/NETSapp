import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Event, Activity } from '../../models/explore.model';
import { ExploreDataService } from '../../data/explore-data.service';
import { UserDnaService } from '../../data/user-dna.service';

// ── Tag label map ──────────────────────────────────────────────────────────
const TAG_LABELS: Record<string, string> = {
  // Food & Beverage
  'fnb:breakfast': 'Breakfast', 'fnb:lunch': 'Lunch', 'fnb:dinner': 'Dinner',
  'fnb:supper': 'Supper',       'fnb:brunch': 'Brunch',
  'fnb:bubbletea': 'Bubble Tea','fnb:coffee': 'Coffee',  'fnb:juice': 'Juice',
  'fnb:chinese': 'Chinese',     'fnb:western': 'Western','fnb:japanese': 'Japanese',
  'fnb:korean': 'Korean',       'fnb:malay': 'Malay',    'fnb:indian': 'Indian',
  'fnb:thai': 'Thai',           'fnb:fastfood': 'Fast Food',
  'fnb:hawker': 'Hawker',       'fnb:foodcourt': 'Food Court',
  'fnb:cafe': 'Café',           'fnb:restaurant': 'Restaurant',
  'fnb:workshop': 'Workshop',   'fnb:local': 'Local',    'fnb:food': 'Food',
  'fnb:bbq': 'BBQ',             'fnb:buffet': 'Buffet',
  // Shopping
  'shopping:fashion': 'Fashion',       'shopping:beauty': 'Beauty',
  'shopping:electronics': 'Electronics','shopping:groceries': 'Groceries',
  'shopping:convenience': 'Convenience','shopping:lifestyle': 'Lifestyle',
  // Entertainment
  'ent:cinema': 'Cinema',        'ent:arcade': 'Arcade',       'ent:ktv': 'KTV',
  'ent:gaming': 'Gaming',        'ent:liveevents': 'Live Events','ent:nightlife': 'Nightlife',
  'ent:museum': 'Museum',        'ent:bowling': 'Bowling',     'ent:escaperoom': 'Escape Room',
  'ent:music': 'Music',          'ent:kpop': 'K-Pop',          'ent:comedy': 'Comedy',
  'ent:concert': 'Concert',      'ent:clubbing': 'Clubbing',
  // Fitness
  'fit:gym': 'Gym',       'fit:studio': 'Studio',  'fit:sports': 'Sports',
  'fit:climbing': 'Climbing','fit:yoga': 'Yoga',   'fit:fitness': 'Fitness',
  'fit:routine': 'Routine',
  // Education
  'edu:books': 'Books', 'edu:courses': 'Courses', 'edu:stationery': 'Stationery',
  // Transport
  'trn:ridehailing': 'Ride-Hailing', 'trn:transit': 'Transit', 'trn:fuel': 'Fuel',
  // Lifestyle & Services
  'lst:telco': 'Telco', 'lst:subscription': 'Subscription', 'lst:wellness': 'Wellness',
};

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: false,
})
export class ExplorePage implements OnDestroy {

  // ── Tab state ──────────────────────────────────────────────────────────
  activeTab: 'events' | 'activities' = 'events';

  setActiveTab(tab: 'events' | 'activities') {
    this.activeTab = tab;
    this.filterOpen = false;
    this.clearFilters();
  }

  // ── Search ─────────────────────────────────────────────────────────────
  searchText = '';

  onSearchChange() {
    this.filterTrigger$.next();
  }

  // ── Filter panel state ─────────────────────────────────────────────────
  filterOpen = false;

  // Selected filter values (arrays — iterable in *ngFor)
  selectedVenues:     string[] = [];
  selectedGenres:     string[] = [];   // derived from ent:* tags
  selectedCategories: string[] = [];
  selectedAreas:      string[] = [];

  // Option lists populated from live data
  venueOptions:    string[] = [];
  genreOptions:    { value: string; label: string }[] = [];
  categoryOptions: string[] = [];
  areaOptions:     string[] = [];

  get activeFilterCount(): number {
    return this.selectedVenues.length + this.selectedGenres.length +
           this.selectedCategories.length + this.selectedAreas.length;
  }

  // ── Reactive filter trigger ────────────────────────────────────────────
  private filterTrigger$ = new BehaviorSubject<void>(undefined);
  private subs: Subscription[] = [];

  // ── Observables ────────────────────────────────────────────────────────
  loading$:              Observable<boolean>;
  filteredEvents$:       Observable<Event[]>;
  filteredActivities$:   Observable<Activity[]>;

  // ── Activity modal state ───────────────────────────────────────────────
  selectedActivity: Activity | null = null;
  showActivityModal = false;
  selectedActivityDate = '';
  selectedActivityTime = '';
  todayStr  = new Date().toISOString().split('T')[0];
  maxDateStr: string;

  // ── Event modal state ──────────────────────────────────────────────────
  selectedEvent: Event | null = null;
  showEventModal = false;

  constructor(
    private exploreDataService: ExploreDataService,
    private userDnaService: UserDnaService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.loading$ = this.exploreDataService.loading$;

    // Filtered + searched events (reacts to data, search, and filter changes)
    this.filteredEvents$ = combineLatest([
      this.exploreDataService.scoredEvents$,
      this.exploreDataService.loading$,
      this.filterTrigger$,
    ]).pipe(
      map(([events, loading]) => loading ? [] : this.applyEventFilters(events))
    );

    // Filtered + searched activities
    this.filteredActivities$ = combineLatest([
      this.exploreDataService.scoredActivities$,
      this.exploreDataService.loading$,
      this.filterTrigger$,
    ]).pipe(
      map(([activities, loading]) => loading ? [] : this.applyActivityFilters(activities))
    );

    // Populate venue + genre options whenever events load/refresh
    this.subs.push(
      this.exploreDataService.scoredEvents$.subscribe(events => {
        if (!events.length) return;
        this.venueOptions = [...new Set(events.map(e => e.venue).filter(Boolean))].sort();

        // TODO: genre — if Ticketmaster genre is ever stored as Event.genre field,
        // replace this ent:* tag derivation with a direct field lookup
        const entSet = new Set<string>();
        events.forEach(e => e.tags.filter(t => t.startsWith('ent:')).forEach(t => entSet.add(t)));
        this.genreOptions = [...entSet]
          .map(t => ({ value: t, label: this.tagLabel(t) }))
          .sort((a, b) => a.label.localeCompare(b.label));
      })
    );

    // Populate category + area options whenever activities load
    this.subs.push(
      this.exploreDataService.scoredActivities$.subscribe(activities => {
        if (!activities.length) return;
        this.categoryOptions = [...new Set(activities.map(a => a.category).filter(Boolean))].sort();
        this.areaOptions     = [...new Set(activities.map(a => a.location).filter(Boolean))].sort();
      })
    );

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    this.maxDateStr = maxDate.toISOString().split('T')[0];
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  // ── Filter logic ───────────────────────────────────────────────────────

  private applyEventFilters(events: Event[]): Event[] {
    const q = this.searchText.toLowerCase().trim();
    return events.filter(e => {
      if (q && !e.title.toLowerCase().includes(q) &&
          !e.tags.some(t => t.toLowerCase().includes(q))) return false;
      if (this.selectedVenues.length && !this.selectedVenues.includes(e.venue)) return false;
      if (this.selectedGenres.length && !e.tags.some(t => this.selectedGenres.includes(t))) return false;
      return true;
    });
  }

  private applyActivityFilters(activities: Activity[]): Activity[] {
    const q = this.searchText.toLowerCase().trim();
    return activities.filter(a => {
      if (q && !a.title.toLowerCase().includes(q) &&
          !a.tags.some(t => t.toLowerCase().includes(q))) return false;
      if (this.selectedCategories.length && !this.selectedCategories.includes(a.category)) return false;
      if (this.selectedAreas.length && !this.selectedAreas.includes(a.location)) return false;
      return true;
    });
  }

  toggleFilter(type: 'venue' | 'genre' | 'category' | 'area', value: string) {
    const map: Record<string, string[]> = {
      venue:    this.selectedVenues,
      genre:    this.selectedGenres,
      category: this.selectedCategories,
      area:     this.selectedAreas,
    };
    const arr = map[type];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1); else arr.push(value);
    this.filterTrigger$.next();
  }

  isSelected(type: 'venue' | 'genre' | 'category' | 'area', value: string): boolean {
    const map: Record<string, string[]> = {
      venue:    this.selectedVenues,
      genre:    this.selectedGenres,
      category: this.selectedCategories,
      area:     this.selectedAreas,
    };
    return map[type].includes(value);
  }

  clearFilters() {
    this.selectedVenues     = [];
    this.selectedGenres     = [];
    this.selectedCategories = [];
    this.selectedAreas      = [];
    this.filterTrigger$.next();
  }

  // ── Tag label helper ───────────────────────────────────────────────────

  tagLabel(tag: string): string {
    return TAG_LABELS[tag] ??
      tag.split(':').pop()!
        .replace(/-/g, ' ')
        .replace(/(^|\s)\S/g, c => c.toUpperCase());
  }

  // ── Category icon helper ───────────────────────────────────────────────

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Music':           'musical-notes-outline',
      'Sports':          'football-outline',
      'Arts':            'brush-outline',
      'Theatre':         'theater-masks-outline',
      'Comedy':          'happy-outline',
      'Film':            'film-outline',
      'Family':          'people-outline',
      'Workshop':        'hammer-outline',
      'Fitness':         'barbell-outline',
      'Cultural':        'earth-outline',
      'Dining':          'restaurant-outline',
      'Nightlife':       'wine-outline',
      'Entertainment':   'sparkles-outline',
      'Food & Beverage': 'restaurant-outline',
    };
    return icons[category] || 'compass-outline';
  }

  // ── DNA match colour (kept for getTasteColor calls) ────────────────────

  getTasteColor(match: number): string {
    return this.exploreDataService.getTasteColor(match);
  }

  getTasteMatchReason(event: Event): string {
    return event.matchReason || 'Based on your spending DNA';
  }

  // ── Event modal ────────────────────────────────────────────────────────

  openEvent(event: Event) {
    this.selectedEvent  = event;
    this.showEventModal = true;
  }

  closeEventModal() {
    this.showEventModal = false;
    this.selectedEvent  = null;
  }

  async addToCalendar() {
    if (!this.selectedEvent) return;
    const event = this.selectedEvent;
    this.closeEventModal();
    const eventDate = this.parseEventDate(event.date);
    if (eventDate) {
      await this.userDnaService.addExternalTransaction({
        id: `event-${event.id}`, date: eventDate, time: '19:00',
        amount: event.price || 0, type: 'debit', category: 'Entertainment',
        subcategory: event.category, description: event.title,
        merchant: event.venue, tags: event.tags, isPlanned: true,
      });
    }
    const toast = await this.toastController.create({
      message: 'Added to your calendar as a prediction!',
      duration: 2000, color: 'primary', position: 'bottom', cssClass: 'nets-toast'
    });
    await toast.present();
  }

  async buyTicket() {
    if (!this.selectedEvent) return;
    const event = this.selectedEvent;
    this.closeEventModal();
    const eventDate = this.parseEventDate(event.date);
    if (eventDate) {
      await this.userDnaService.addExternalTransaction({
        id: `ticket-${event.id}`, date: eventDate, time: '19:00',
        amount: event.price || 0, type: 'debit', category: 'Entertainment',
        subcategory: event.category, description: `Ticket: ${event.title}`,
        merchant: event.venue, tags: [...event.tags, 'purchase:confirmed'], isPlanned: false,
      });
    }
    const toast = await this.toastController.create({
      message: `Ticket purchased! $${event.price} paid via NETS Pay.`,
      duration: 2500, color: 'success', position: 'bottom', cssClass: 'nets-toast'
    });
    await toast.present();
  }

  private parseEventDate(dateStr: string): string | null {
    const match = dateStr.match(/\d{1,2}\s+[A-Za-z]{3}/);
    if (match) {
      const now = new Date();
      return `${now.getFullYear()}-${this.monthToNum(match[0].split(' ')[1])}-${match[0].split(' ')[0].padStart(2, '0')}`;
    }
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

  refresh() { this.exploreDataService.refreshEvents(); }

  // ── Activity modal ─────────────────────────────────────────────────────

  openActivity(activity: Activity) {
    this.selectedActivity = activity;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.selectedActivityDate = tomorrow.toISOString().split('T')[0];
    const timeMap: Record<string, string> = { morning: '09:00', afternoon: '14:00', evening: '19:00' };
    this.selectedActivityTime = timeMap[activity.timeOfDay] || '12:00';
    this.showActivityModal = true;
  }

  closeActivityModal() {
    this.showActivityModal = false;
    this.selectedActivity  = null;
  }

  async addActivityToCalendar() {
    if (!this.selectedActivity) return;
    const activity = this.selectedActivity;
    const rawDate  = this.selectedActivityDate;
    const rawTime  = this.selectedActivityTime;

    let dateStr = rawDate?.includes('T') ? rawDate.split('T')[0] : rawDate;
    dateStr = dateStr || this.toLocalDateStr(new Date());

    let timeStr = rawTime?.includes('T') ? rawTime.split('T')[1].slice(0, 5)
                : rawTime?.includes(':')  ? rawTime.slice(0, 5)
                : rawTime;
    timeStr = timeStr || '12:00';

    this.closeActivityModal();

    await this.userDnaService.addExternalTransaction({
      id: `activity-${activity.id}-${Date.now()}`,
      date: dateStr, time: timeStr,
      amount: activity.estimatedCost || 0, type: 'debit',
      category: activity.category,
      subcategory: activity.tags[0]?.split(':')[1] || activity.category,
      description: activity.title, merchant: activity.location,
      tags: activity.tags, isPlanned: true,
    });

    const toast = await this.toastController.create({
      message: `Added to ${dateStr} at ${timeStr}!`,
      duration: 2500, color: 'success', position: 'bottom', cssClass: 'nets-toast'
    });
    await toast.present();
  }

  private toLocalDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onDateChange(event: any) {
    const value = event.detail.value;
    if (value) this.selectedActivityDate = value;
  }

  onTimeChange(event: any) {
    const value = event.detail.value;
    if (value) this.selectedActivityTime = value;
  }
}
