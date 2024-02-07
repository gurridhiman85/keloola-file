import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DocumentView } from '@core/domain-classes/document-view';
import { CommonService } from '@core/services/common.service';
import { OverlayPanelRef } from '@shared/overlay-panel/overlay-panel-ref';
import { BaseComponent } from 'src/app/base.component';

@Component({
  selector: 'app-text-preview',
  templateUrl: './text-preview.component.html',
  styleUrls: ['./text-preview.component.scss']
})
export class TextPreviewComponent extends BaseComponent implements OnChanges {
  textLines: string[] = [];
  isLoading = false;
  @Input() document: DocumentView;
  constructor(
    private commonService: CommonService,
    private overlayRef: OverlayPanelRef) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['document']) {
      this.readDocument();
    }
  }

  readDocument() {
    this.isLoading = true;
    this.sub$.sink = this.commonService.readDocument(this.document.documentId, this.document.isVersion)
      .subscribe((data: { [key: string]: string[] }) => {
        this.isLoading = false;
        this.textLines = data['result'];
      }, (err) => {
        this.isLoading = false;
      });
  }

  onCancel() {
    this.overlayRef.close();
  }

}
