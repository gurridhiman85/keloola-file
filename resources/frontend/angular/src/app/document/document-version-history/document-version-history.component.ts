import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { DocumentView } from '@core/domain-classes/document-view';
import { DocumentVersion } from '@core/domain-classes/documentVersion';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { BasePreviewComponent } from '@shared/base-preview/base-preview.component';
import { OverlayPanel } from '@shared/overlay-panel/overlay-panel.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { DocumentService } from '../document.service';

@Component({
  selector: 'app-document-version-history',
  templateUrl: './document-version-history.component.html',
  styleUrls: ['./document-version-history.component.scss'],
})
export class DocumentVersionHistoryComponent
  extends BaseComponent {
  documentVersions: DocumentVersion[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DocumentInfo,
    private overlay: OverlayPanel,
    public dialogRef: MatDialogRef<DocumentVersionHistoryComponent>,
    private toastrService: ToastrService,
    private documentService: DocumentService,
    private commonService: CommonService,
    private translationService: TranslationService,
    private commandDialogService: CommonDialogService
  ) {
    super();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  onDocumentView(document: DocumentInfo) {
    const urls = document.url.split('.');
    const extension = urls[1];
    const documentView: DocumentView = {
      documentId: document.id,
      name: this.data.name,
      extension: extension,
      isRestricted: document.isAllowDownload,
      isVersion: true,
      id: this.data.id,
      isFromPreview: false,
    };
    this.overlay.open(BasePreviewComponent, {
      position: 'center',
      origin: 'global',
      panelClass: ['file-preview-overlay-container', 'white-background'],
      data: documentView,
    });
  }

  restoreDocumentVersion(version: DocumentVersion) {
    this.sub$.sink = this.commandDialogService
      .deleteConformationDialog(
        'Are you sure you want to restore this to current version'
      )
      .subscribe((isTrue) => {
        if (isTrue) {
          this.sub$.sink = this.documentService
            .restoreDocumentVersion(this.data.id, version.id)
            .subscribe(() => {
              this.toastrService.success(
                this.translationService.getValue(
                  'VERSION_RESTORED_SUCCESSFULLY'
                )
              );
              this.dialogRef.close(true);
            });
        }
      });
  }

  downloadDocument(version: DocumentVersion) {
    const doc: DocumentInfo = {
      id: version.id,
      isVersion: true,
      name: '',
      extension: '',
      url: '',
    };
    this.sub$.sink = this.commonService
      .downloadDocument(doc.id, true)
      .subscribe(
        (event) => {
          if (event.type === HttpEventType.Response) {
            this.addDocumentTrail(
              this.data.id,
              DocumentOperation.Download.toString()
            );
            this.downloadFile(event, doc);
          }
        },
        (error) => {
          this.toastrService.error(
            this.translationService.getValue('ERROR_WHILE_DOWNLOADING_DOCUMENT')
          );
        }
      );
  }

  addDocumentTrail(id: string, operation: string) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: id,
      operationName: operation,
    };
    this.sub$.sink = this.commonService
      .addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe();
  }

  private downloadFile(data: HttpResponse<Blob>, documentInfo: DocumentInfo) {
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
