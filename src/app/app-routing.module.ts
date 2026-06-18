import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'day-plan/:date',
    loadChildren: () => import('./pages/day-plan/day-plan.module').then(m => m.DayPlanPageModule)
  },
  {
    path: 'transaction-detail/:id',
    loadChildren: () => import('./pages/transaction-detail/transaction-detail.module').then(m => m.TransactionDetailPageModule)
  },
  {
    path: 'activity-detail/:id',
    loadChildren: () => import('./pages/activity-detail/activity-detail.module').then(m => m.ActivityDetailPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
