import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '@shared/shared.module';
import { DocumentByCategoryChartComponent } from './document-by-category-chart/document-by-category-chart.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalenderViewComponent } from './calender-view/calender-view.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime-ex';

@NgModule({
  declarations: [
    DashboardComponent,
    DocumentByCategoryChartComponent,
    CalenderViewComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MatSortModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCardModule,
    SharedModule,
    NgxChartsModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    MatSelectModule,
    MatDialogModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule
  ],
})
export class DashboardModule {}
