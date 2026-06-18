import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DayPlanPage } from './day-plan.page';

const routes: Routes = [{ path: '', component: DayPlanPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DayPlanPageRoutingModule {}
