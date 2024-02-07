import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { BaseComponent } from 'src/app/base.component';
import { DocumentService } from '../document.service';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { Router, ActivatedRoute } from '@angular/router';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { tap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-document-manage',
  templateUrl: './document-manage.component.html',
  styleUrls: ['./document-manage.component.scss'],
})
export class DocumentManageComponent extends BaseComponent implements OnInit {
  documentForm: UntypedFormGroup;
  loading$: Observable<boolean>;
  documentSource: string;
  selectedFolderId: number;
  mainFolder: any;
  uploadPercentagefiles: any;
  uploadAveragePrecentage: [];

  constructor(
    private toastrService: ToastrService,
    private documentService: DocumentService,
    private router: Router,
    private commonService: CommonService,
    private translationService: TranslationService,
    private route: ActivatedRoute,
  ) {
    super();
    this.uploadAveragePrecentage = [];
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.selectedFolderId = params['id'];
      this.documentService.selectedFolderId = params['id'];
    });
  }

  saveDocument(document: DocumentInfo) {
    if (document.fileArray && document.fileArray.length > 0) {
      //will check if there is already a folder with same name in same directory.
      //if yes then we will increment its number to make new one and use it in every file.
      if(document.fileArray[0].webkitRelativePath){
        document.localPath = document.fileArray[0].webkitRelativePath;
        this.sub$.sink = this.commonService.checkFolderExitence(document).subscribe((c) => {
          if(c){
            this.mainFolder = c['mainFolder'];
            document.mainFolder = this.mainFolder;
            this.uploadAveragePrecentage['folder'] = this.mainFolder;
            this.uploadChunk(document);
          }
        });
      }else{
        this.uploadChunk(document);
      }
    }
  }

  uploadChunk(document){
    const uploadPromises = [];
    this.uploadPercentagefiles = document.fileArray;
    this.documentService.updateUploadPercentageFiles(this.uploadPercentagefiles);
    const totalFiles = document.fileArray.length;
    for (let i = 0; i < totalFiles; i++) {
        document.fileData = document.fileArray[i];
        if(document.fileArray[i].webkitRelativePath){
          document.localPath = document.fileArray[i].webkitRelativePath;
        }
        uploadPromises.push(this.uploadFile(document,i));
    }

    Promise.all(uploadPromises).then(() => {
      this.documentService.updateUploadPercentageFiles([]);
      this.documentService.updateUploadAveragePercentage([]);
      this.router.navigate(['/documents', this.selectedFolderId]);
    }).catch((errors) => {
      if(errors.error){
        this.toastrService.error(errors.error.message);
      }
    });
  }

  async uploadFile(document: DocumentInfo, i: number) {
    const fileData = document.fileData;
    const filename = fileData.name;
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks (adjust as needed)
    const totalSize = fileData.size;
    let offset = 0;
    const totalChunks = Math.ceil(totalSize / chunkSize);

    for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
      const chunk = fileData.slice(offset, offset + chunkSize);

      await (this.documentService
        .uploadChunk(document, chunk, chunkNumber, totalChunks, filename) as any) // Use 'as any' to temporarily avoid type issues
        .pipe(
          tap((event: any) => {
            if (event.type === 'UploadProgress') {
              const percentDone = event.loaded;

              this.uploadPercentagefiles[i].progress = percentDone;
              this.documentService.updateUploadPercentageFiles(this.uploadPercentagefiles);
              // Calculate the average progress
              const arrayOfFiles: File[] = Array.from(this.uploadPercentagefiles);
              const totalProgress = arrayOfFiles.reduce((sum, file) => sum + (file['progress'] || 0), 0);
              const averageProgress = arrayOfFiles.length > 0 ? totalProgress / arrayOfFiles.length : 0;

              let roundedValue = Math.round(averageProgress * 100) / 100;
              roundedValue = Number.isInteger(roundedValue) ? Math.floor(averageProgress) : roundedValue;
              this.uploadAveragePrecentage['averageProgress'] = roundedValue;
              this.documentService.updateUploadAveragePercentage(this.uploadAveragePrecentage);
            }
          }),
          filter((event: any) => event.type === 'UploadProgress')
        )
        .toPromise();
      offset += chunkSize;
    }

    this.toastrService.success(
      `${fileData.name} ${this.translationService.getValue('DOCUMENT_SAVE_SUCCESSFULLY')}`
    );
  }

  addDocumentTrail(id) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: id,
      operationName: DocumentOperation.Created.toString(),
    };
    this.sub$.sink = this.commonService
      .addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe((c) => {
        this.router.navigate(['/documents',this.selectedFolderId]);
      });
  }
}
