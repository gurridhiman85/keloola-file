import { AfterViewInit, Component, ElementRef, Inject, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DocumentView } from '@core/domain-classes/document-view';
import { CommonService } from '@core/services/common.service';
import { environment } from '@environments/environment';
import { OverlayPanelRef } from '@shared/overlay-panel/overlay-panel-ref';
import { BaseComponent } from 'src/app/base.component';

@Component({
  selector: 'app-office-viewer',
  templateUrl: './office-viewer.component.html',
  styleUrls: ['./office-viewer.component.scss']
})
export class OfficeViewerComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('iframe') iframe: ElementRef<HTMLIFrameElement>;
  isLive = true;
  isLoading: boolean = false;
  token = '';
  @Input() document: DocumentView;

  constructor(
    private commonService: CommonService,
    private overlayRef: OverlayPanelRef
  ) {
    super();
  }

  ngOnInit(): void {
    if (environment.apiUrl.indexOf('localhost') >= 0) {
      this.isLive = false;
    }
  }

  ngAfterViewInit() {
    if (this.isLive) {
      this.getDocumentToken();
    }
  }

  getDocumentToken() {
    this.isLoading = true;
    this.sub$.sink = this.commonService.getDocumentToken(this.document.documentId)
      .subscribe((token: { [key: string]: string }) => {
        this.token = token['result'];
        const host = location.host;
        const protocal = location.protocol;
        const url = environment.apiUrl === '/' ? `${protocal}//${host}/` : environment.apiUrl;
        this.iframe.nativeElement.src = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(`${url}api/document/${this.document.documentId}/officeviewer?token=${this.token}&isVersion=${this.document.isVersion}`);
        this.isLoading = false;
      }, (err) => {
        this.isLoading = false;
      });
  }

  onCancel() {
    this.overlayRef.close();
  }

  override ngOnDestroy() {
    this.sub$.sink = this.commonService.deleteDocumentToken(this.token)
      .subscribe(() => { });
    super.ngOnDestroy();
  }
}
