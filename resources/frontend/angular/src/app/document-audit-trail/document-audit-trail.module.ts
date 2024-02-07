import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentAuditTrailRoutingModule } from './document-audit-trail-routing.module';
import { DocumentAuditTrailComponent } from './document-audit-trail.component';
import { MatSortModule } from '@angular/material/sort';
import { TranslateModule } from '@ngx-translate/core';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { UrlTransformPipe } from './document-audit-trail.component';

@NgModule({
  declarations: [DocumentAuditTrailComponent,UrlTransformPipe,],
  imports: [
    CommonModule,
    DocumentAuditTrailRoutingModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    TranslateModule,
  ],
})
export class DocumentAuditTrailModule {}
