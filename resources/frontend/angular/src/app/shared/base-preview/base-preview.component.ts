import { I } from '@angular/cdk/keycodes';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { DocumentView } from '@core/domain-classes/document-view';
import { ClonerService } from '@core/services/clone.service';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { environment } from '@environments/environment';
import { OVERLAY_PANEL_DATA } from '@shared/overlay-panel/overlay-panel-data';
import { OverlayPanelRef } from '@shared/overlay-panel/overlay-panel-ref';
import { OverlayPanel } from '@shared/overlay-panel/overlay-panel.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';

@Component({
  selector: 'app-base-preview',
  templateUrl: './base-preview.component.html',
  styleUrls: ['./base-preview.component.scss']
})
export class BasePreviewComponent extends BaseComponent implements OnInit {
  type = '';
  currentDoc: DocumentView;
  isLoading: boolean = false;
  isDownloadFlag: boolean = false;
  baseUrl: string = '';

  constructor(
    public overlay: OverlayPanel,
    private commonService: CommonService,
    @Inject(OVERLAY_PANEL_DATA) public data: DocumentView,
    private clonerService: ClonerService,
    private overlayRef: OverlayPanelRef,
    private toastrService: ToastrService,
    private translationService: TranslationService) {
    super();
  }

  ngOnInit(): void {
    this.onDocumentView(this.data);
  }

  closeToolbar() {
    this.overlayRef.close();
  }

  onDocumentView(document: DocumentView) {
    this.currentDoc = this.clonerService.deepClone<DocumentView>(document);
    const allowExtesions = environment.allowExtesions;
    const allowTypeExtenstion = allowExtesions.find(c => c.extentions.find(ext => ext === document.extension));
    this.type = allowTypeExtenstion ? allowTypeExtenstion.type : '';

    // if(!document.is_anonymous || document.is_anonymous != 1){
      this.getIsDownloadFlag(document);
    // }

    this.addDocumentTrail(document.isVersion ? document.id : document.documentId, DocumentOperation.Read.toString(),document.is_anonymous == 1 ? document.is_anonymous : 0, document.is_anonymous == 1 ? document.createdBy : null);
  }

  addDocumentTrail(documentId: string, operation: string, is_anonymous: number, createdBy: string) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: documentId,
      operationName: operation,
      is_anonymous: is_anonymous,
      createdBy: createdBy
    };
    if(is_anonymous == 1){
      this.sub$.sink = this.commonService.addDocumentAuditTrailAnonymous(objDocumentAuditTrail)
      .subscribe(c => {
      });
    }else{
      this.sub$.sink = this.commonService.addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe(c => {
      });
    }

  }

  getIsDownloadFlag(document: DocumentView) {
    this.sub$.sink = this.commonService.isDownloadFlag(this.data.isVersion ? document.id : document.documentId,this.data.isFromPreview)
      .subscribe(c => {
        this.isDownloadFlag = c;
      });
  }

  downloadDocument(documentView: DocumentView) {

    this.baseUrl = window.location.origin;
    const absoluteUrl = `${this.baseUrl}/download-file/${this.currentDoc.documentId}/${documentView.isVersion}`;
    // Open the absolute URL in a new tab for download
    window.open(absoluteUrl, '_blank');
    this.addDocumentTrail(documentView.isVersion ? documentView.id : documentView.documentId,DocumentOperation.Download.toString(),0,null
    );
  }

  private downloadFile(data: HttpResponse<Blob>, documentView: DocumentView) {
    const downloadedFile = new Blob([data.body], { type: data.body.type });
    const a = document.createElement('a');
    a.setAttribute('style', 'display:none;');
    document.body.appendChild(a);
    a.download = this.data.name;
    a.href = URL.createObjectURL(downloadedFile);
    a.target = '_blank';
    a.click();
    document.body.removeChild(a);
  }

}
