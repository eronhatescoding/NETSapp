import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { UserDnaService } from '../../data/user-dna.service';
import { SeedService } from '../../data/seed.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage {
  isSeeding = false;

  constructor(
    private location: Location,
    private userDnaService: UserDnaService,
    private seedService: SeedService,
    private toastCtrl: ToastController,
  ) {}

  back() { this.location.back(); }

  async seedData() {
    if (this.isSeeding) return;
    this.isSeeding = true;
    try {
      const result = await this.seedService.forceSeed();
      const toast = await this.toastCtrl.create({
        message: `Seeded ${result.merchants} merchants + ${result.transactions} transactions`,
        duration: 3500,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
    } catch (err: any) {
      console.error('[Settings] Seed failed:', err);
      const toast = await this.toastCtrl.create({
        message: 'Seed failed — check console for details',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    } finally {
      this.isSeeding = false;
    }
  }

  async exportDna() {
    const json = this.userDnaService.exportDnaJson();
    try {
      await navigator.clipboard.writeText(json);
      const toast = await this.toastCtrl.create({
        message: 'DNA JSON copied to clipboard',
        duration: 2500,
        color: 'primary',
        position: 'bottom',
      });
      await toast.present();
    } catch {
      // Clipboard not available (HTTP context) — fall back to console
      console.log('[DNA Export JSON]', json);
      const toast = await this.toastCtrl.create({
        message: 'JSON logged to DevTools console',
        duration: 2500,
        color: 'medium',
        position: 'bottom',
      });
      await toast.present();
    }
  }
}
