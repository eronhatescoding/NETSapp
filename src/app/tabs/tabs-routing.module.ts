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
        path: 'insights',
        loadChildren: () => import('../pages/insights/insights.module').then(m => m.InsightsPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/calendar',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/calendar',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
