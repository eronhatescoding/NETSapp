import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'calendar',
        loadChildren: () => import('../pages/calendar/calendar.module').then(m => m.CalendarPageModule)
      },
      {
        path: 'explore',
        loadChildren: () => import('../pages/explore/explore.module').then(m => m.ExplorePageModule)
      },
      {
        path: 'dna',
        loadChildren: () => import('../pages/insights/insights.module').then(m => m.InsightsPageModule)
      },
      {
        path: 'pay',
        loadChildren: () => import('../pages/pay/pay.module').then(m => m.PayPageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('../pages/settings/settings.module').then(m => m.SettingsPageModule)
      },
      {
        path: 'transaction-detail/:id',
        loadChildren: () => import('../pages/transaction-detail/transaction-detail.module').then(m => m.TransactionDetailPageModule)
      },
      {
        path: 'day-plan/:date',
        loadChildren: () => import('../pages/day-plan/day-plan.module').then(m => m.DayPlanPageModule)
      },
      {
        path: 'activity-detail/:id',
        loadChildren: () => import('../pages/activity-detail/activity-detail.module').then(m => m.ActivityDetailPageModule)
      },
      {
        path: '',
        redirectTo: 'calendar',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'tabs/calendar',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
