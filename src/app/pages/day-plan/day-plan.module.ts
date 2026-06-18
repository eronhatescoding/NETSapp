import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DayPlanPageRoutingModule } from './day-plan-routing.module';
import { DayPlanPage } from './day-plan.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, DayPlanPageRoutingModule],
  declarations: [DayPlanPage]
})
export class DayPlanPageModule {}
