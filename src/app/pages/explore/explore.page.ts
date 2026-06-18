import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { Event, Activity } from '../../models/explore.model';
import { ExploreDataService } from '../../data/explore-data.service';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: false,
})
export class ExplorePage {
  activeTab: 'events' | 'activities' = 'events';
  searchText: string = '';
  selectedActivity: Activity | null = null;
  showActivityModal: boolean = false;

  constructor(
    private exploreDataService: ExploreDataService,
    private router: Router,
    private toastController: ToastController
  ) {}

  get events(): Event[] {
    return this.exploreDataService.getEvents().filter(e =>
      e.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(this.searchText.toLowerCase()))
    );
  }

  get activities(): Activity[] {
    return this.exploreDataService.getActivities().filter(a =>
      a.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(this.searchText.toLowerCase()))
    );
  }

  getTasteColor(match: number): string {
    return this.exploreDataService.getTasteColor(match);
  }

  getTasteMatchReason(activity: Activity): string {
    return this.exploreDataService.getTasteMatchReason(activity);
  }

  openActivity(activity: Activity) {
    this.selectedActivity = activity;
    this.showActivityModal = true;
  }

  closeActivityModal() {
    this.showActivityModal = false;
    this.selectedActivity = null;
  }

  async addToCalendar() {
    this.closeActivityModal();
    const toast = await this.toastController.create({
      message: 'Added to your calendar!',
      duration: 2000,
      color: 'primary',
      position: 'bottom',
      cssClass: 'nets-toast'
    });
    await toast.present();
  }
}
