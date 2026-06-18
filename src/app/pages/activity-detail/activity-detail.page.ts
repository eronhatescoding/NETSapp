import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Activity } from '../../models/explore.model';
import { ExploreDataService } from '../../data/explore-data.service';

@Component({
  selector: 'app-activity-detail',
  templateUrl: './activity-detail.page.html',
  styleUrls: ['./activity-detail.page.scss'],
  standalone: false,
})
export class ActivityDetailPage implements OnInit {
  activity: Activity | undefined;

  constructor(
    private route: ActivatedRoute,
    private exploreDataService: ExploreDataService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.activity = this.exploreDataService.getActivityById(id);
  }
}
