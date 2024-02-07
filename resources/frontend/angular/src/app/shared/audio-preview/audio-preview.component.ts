import { HttpEventType } from '@angular/common/http';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { DocumentView } from '@core/domain-classes/document-view';
import { CommonService } from '@core/services/common.service';
import { OverlayPanelRef } from '@shared/overlay-panel/overlay-panel-ref';
import { BaseComponent } from 'src/app/base.component';

@Component({
  selector: 'app-audio-preview',
  templateUrl: './audio-preview.component.html',
  styleUrls: ['./audio-preview.component.scss']
})
export class AudioPreviewComponent extends BaseComponent implements OnChanges {
  @ViewChild('playerEl', { static: true }) playerEl: ElementRef;
  isLoading = false;
  @Input() document: DocumentView;
  htmlSource: HTMLSourceElement;
  constructor(
    public overlayRef: OverlayPanelRef,
    public commonService: CommonService) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['document']) {
      this.getDocument();
    }
  }

  getDocument() {
    this.isLoading = true;
    this.sub$.sink = this.commonService.downloadDocument(this.document.documentId, this.document.isVersion)
      .subscribe(data => {
        if (data.type === HttpEventType.Response) {
          this.isLoading = false;
          if (this.htmlSource && this.player().hasChildNodes()) {
            this.player().removeChild(this.htmlSource);
          }
          const imgageFile = new Blob([data.body], { type: data.body.type });
          this.htmlSource = document.createElement('source');
          this.htmlSource.src = URL.createObjectURL(imgageFile);
          this.htmlSource.type = data.body.type;
          this.player().pause();
          this.player().load();
          this.player().appendChild(this.htmlSource);
          this.player().play();
        }
      }, (err) => {
        this.isLoading = false;
      });
  }

  player() {
    return this.playerEl.nativeElement as HTMLVideoElement | HTMLAudioElement;
  }

  onCancel() {
    this.overlayRef.close();
  }

}
