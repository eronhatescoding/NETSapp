import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { InsightsPageRoutingModule } from './insights-routing.module';
import { InsightsPage } from './insights.page';
import { WrappedComponent } from '../wrapped/wrapped.component';

@NgModule({
  imports: [CommonModule, FormsModule, RouterModule, IonicModule, InsightsPageRoutingModule],
  declarations: [InsightsPage, WrappedComponent]
})
export class InsightsPageModule {}
