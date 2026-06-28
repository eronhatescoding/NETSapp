import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CalendarPageRoutingModule } from './calendar-routing.module';
import { FilterRealPipe, FilterPlannedPipe } from './calendar-filter.pipe';
import { CalendarPage } from './calendar.page';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, CalendarPageRoutingModule],
  declarations: [CalendarPage, FilterRealPipe, FilterPlannedPipe]
})
export class CalendarPageModule {}
