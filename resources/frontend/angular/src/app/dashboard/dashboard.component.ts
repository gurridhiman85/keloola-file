import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { DashboradService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends BaseComponent implements OnInit {
  totalAssignDocumentCount = 0;
  expireSoonDocumentCount = 0
  constructor(private dashboardService: DashboradService) {
    super();
  }

  ngOnInit() {
  }
}


