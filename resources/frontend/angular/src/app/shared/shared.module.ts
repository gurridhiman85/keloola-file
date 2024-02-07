import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { BasePreviewComponent } from './base-preview/base-preview.component';
import { HasClaimDirective } from './has-claim.directive';
import { PipesModule } from './pipes/pipes.module';
import { ImagePreviewComponent } from './image-preview/image-preview.component';
import { OfficeViewerComponent } from './office-viewer/office-viewer.component';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { TextPreviewComponent } from './text-preview/text-preview.component';
import { AudioPreviewComponent } from './audio-preview/audio-preview.component';
import { VideoPreviewComponent } from './video-preview/video-preview.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MaterialModule } from './material.module';
import { FeatherIconsModule } from './components/feather-icons/feather-icons.module';
@NgModule({
  declarations: [
    HasClaimDirective,
    ImagePreviewComponent,
    BasePreviewComponent,
    PdfViewerComponent,
    TextPreviewComponent,
    OfficeViewerComponent,
    AudioPreviewComponent,
    VideoPreviewComponent
  ],
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    OverlayModule,
    NgxExtendedPdfViewerModule,
    PipesModule,
    MatProgressSpinnerModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule,
    FeatherIconsModule,
    HasClaimDirective,
    OverlayModule,
    ImagePreviewComponent,
    BasePreviewComponent,
    AudioPreviewComponent,
    VideoPreviewComponent,
    TranslateModule,
    MaterialModule
  ]
})
export class SharedModule { }
