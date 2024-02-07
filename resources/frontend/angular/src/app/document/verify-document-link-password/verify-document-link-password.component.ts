import { Component, Inject, OnInit, ViewChild,ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VerifyDocumentLink } from '@core/domain-classes/verify-document-link';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { UntypedFormBuilder, UntypedFormGroup, Validators,FormGroup } from '@angular/forms';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient, HttpParams, HttpResponse, HttpEventType } from '@angular/common/http';
import { CommonError } from '@core/error-handler/common-error';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { DocumentVerifyLinkInfo } from '@core/domain-classes/document-verify-link';
import { DocumentResource } from '@core/domain-classes/document-resource';
import { DocumentDataSource } from '../document-list/document-datasource';
import { DocumentService } from '../document.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentView } from '@core/domain-classes/document-view';
import { BasePreviewComponent } from '@shared/base-preview/base-preview.component';
import { OverlayPanel } from '@shared/overlay-panel/overlay-panel.service';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';

// ... other imports and component decorator
@Component({
  selector: 'app-verify-document-link-password',
  templateUrl: './verify-document-link-password.component.html',
  styleUrls: ['./verify-document-link-password.component.scss']
})

export class VerifyDocumentLinkPasswordComponent extends BaseComponent implements OnInit {
  verifyId: string;
  formpassword: string;
  documentId: string;
  verifyForm: UntypedFormGroup;
  sharedBy: string;
  public editor: any = ClassicEditor;
  isLoading = false;
  linkDetails: DocumentVerifyLinkInfo[] = [];
  documentResource: DocumentResource;
  dataSource: DocumentDataSource;
  documents: DocumentInfo[] = [];
  displayedColumns: string[] = [
    // 'select',
    'action',
    'name',
    'categoryName',
    'createdDate',
    'createdBy',
  ];
  //dataSource: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input') input: ElementRef;
  @ViewChild('metatag') metatag: ElementRef;
  //documentType:string;
  parentfolderId:number;
  selectedFolderId: any = null;
  parentFolderDetails:any ={};
  breadCrumbArray: { id: any; name: any; }[] = [];
  showFolder: boolean =  false;
  allowType:number;
  allowPassword:boolean=true;
  validLink:boolean = true;
  baseUrl : string;

  constructor(
    private documentService: DocumentService,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private commonHttpErrorService: CommonHttpErrorService,
    private toastr: ToastrService,
    private toastrService: ToastrService,
    private commonService: CommonService,
    private translationService: TranslationService,
    public overlay: OverlayPanel,
  ) {
    super();
    this.documentResource = new DocumentResource();
    //this.documentResource.pageSize = 10;
    this.documentResource.orderBy = 'createdDate desc';
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((obs) => {
      this.verifyId = obs.get('id');
    });
    this.getverfiylinkDetailsById();
    this.createVerifyForm();
    this.dataSource = new DocumentDataSource(this.documentService);
  }

  getverfiylinkDetailsById() {
    this.sub$.sink = this.commonService
      .getverfiylinkDetailsById(this.verifyId)
      .subscribe((linkDetail: DocumentVerifyLinkInfo[]) => {
        this.linkDetails = linkDetail;
        this.allowType = this.linkDetails['allowType'];
        if(this.linkDetails['allowPassword'] != 1){
          this.documentResource.id = this.linkDetails['documentId'];
          this.documentResource.skip = 0;
          this.dataSource = new DocumentDataSource(this.documentService);
          this.dataSource.loadLinkdocuemnts(this.documentResource);
          this.showFolder = true;
          this.allowPassword = false;
          this.addDocumentTrail(
            this.linkDetails['documentId'],
            DocumentOperation.Link_Without_Password.toString()
          );
        }
        const currentDate = new Date();
        const dateString = this.linkDetails['endDate'];
        const dateToCompare = new Date(dateString);
        if (dateToCompare < currentDate && this.linkDetails['isTimeBound'] == 1) {
          this.validLink = false;
          this.showFolder = false;
          this.allowPassword = false;
          this.toastr.error('Link is not valid');
        }
      });
      //console.log('this.allowPassword',this.allowPassword);
  }

  createVerifyForm() {
    this.verifyForm = this.fb.group({
      password: ['', [Validators.required]],
    });
  }

  submitPassword(password) {
    if (this.verifyForm.valid) {
      this.isLoading = true;
      let formData = new FormData();
      formData.append('verifyId', this.verifyId);
      formData.append('password', password);
      this.sub$.sink = this.checkPassword(formData).subscribe(
        (c: VerifyDocumentLink) => {
          this.isLoading = false;
          this.sharedBy = c['sharedBy'];
          this.documentResource.id = c['id'];
          this.documentResource.skip = 0;
          this.dataSource = new DocumentDataSource(this.documentService);
          this.dataSource.loadLinkdocuemnts(this.documentResource);
          this.showFolder = true;
          this.allowPassword = false;
          this.addDocumentTrail(
            this.linkDetails['documentId'],
            DocumentOperation.Link_With_Password.toString()
          );
        },
        (err: CommonError) => {
          this.isLoading = false;
          this.toastr.error(err.error['message']);
        }
      );
    }
    else{
      this.verifyForm.markAllAsTouched();
    }
  }

  checkPassword(entity: any): Observable<VerifyDocumentLink | CommonError>  {
    const url = `verify-document`;
      return this.httpClient
      .post<VerifyDocumentLink>(url, entity)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  private markFormGroupTouched(formGroup: UntypedFormGroup) {
    (<any>Object).values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }
  downloadDocument(documentInfo) {
    this.baseUrl = window.location.origin;
    const absoluteUrl = `${this.baseUrl}/download-file/${documentInfo.id}`;
    // Open the absolute URL in a new tab for download
    window.open(absoluteUrl, '_blank');
    this.addDocumentTrail(
      documentInfo.id,
      DocumentOperation.Download.toString()
    );
  }

  addDocumentTrail(id: string, operation: string) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: id,
      operationName: operation,
      createdBy: this.linkDetails['createdBy'],
      is_anonymous: 1
    };
    this.sub$.sink = this.commonService
      .addDocumentAuditTrailAnonymous(objDocumentAuditTrail)
      .subscribe();
  }

  private downloadFile(data: HttpResponse<Blob>, documentInfo) {
    const downloadedFile = new Blob([data.body], { type: data.body.type });
    const a = document.createElement('a');
    a.setAttribute('style', 'display:none;');
    document.body.appendChild(a);
    a.download = documentInfo.name;
    a.href = URL.createObjectURL(downloadedFile);
    a.target = '_blank';
    a.click();
    document.body.removeChild(a);
  }

  getbreadCrumb(data){
    if(!data.mimeType){
      this.parentfolderId = data.parentId;
      this.documentService.breadCrumbArray.push({ id: data.id, name: data.name, pageIndex : 0, skip : 0 });
      this.documentResource.parentId = data.id;
      this.documentResource.skip = 0;
      this.selectedFolderId = data.id;
      this.documentService.selectedFolderId = this.selectedFolderId;
      this.breadCrumbArray = this.documentService.breadCrumbArray;
      this.dataSource.loadLinkdocuemnts(this.documentResource);
    }
  }
  getparentbreadCrumb(parentfolderId,back){
    //console.log('getparentbreadCrumb',this.documentService.breadCrumbArray)
    if(this.documentService.breadCrumbArray.length == 1 && back == 2){
      this.documentResource.parentId = '';
      this.documentResource.skip = 0;
      this.dataSource.loadLinkdocuemnts(this.documentResource);
      this.breadCrumbArray = [];
      this.documentService.breadCrumbArray = [];
    }
    else if(parentfolderId){
      this.documentResource.parentId = parentfolderId;
      this.documentResource.skip = 0;
      this.getDocument(parentfolderId,back);
    }else{
      this.documentResource.parentId = '';
      this.documentResource.skip = 0;
      this.breadCrumbArray = [];
      this.documentService.breadCrumbArray = [];
      this.selectedFolderId = 0;
      this.documentService.selectedFolderId = this.selectedFolderId;
      this.dataSource.loadLinkdocuemnts(this.documentResource);
    }
  }

  getDocument(parentfolderId,back): void {
    this.documentService
      .getLinkDocument(parentfolderId)
      .subscribe(
        (resp: HttpResponse<DocumentInfo[]>) => {
          this.parentFolderDetails = resp;
          this.parentfolderId = this.parentFolderDetails.parentId;

          if(back == 2){
            this.documentService.breadCrumbArray.pop();
            this.breadCrumbArray = this.documentService.breadCrumbArray;
          }else if(back == 3){
            //this will create the breadcrumb of clicked folder
            let targetObject = { id: this.parentFolderDetails.id, name: this.parentFolderDetails.name };
            //console.log('targetObject',targetObject)
            // Finding the index of the target object in the array
            let index = this.documentService.breadCrumbArray.findIndex(obj => obj.id === targetObject.id);
            //console.log('index',index)
            // Extracting elements before the target object
            if (index !== -1) {
                let elementsBefore = this.documentService.breadCrumbArray.slice(0, index+1);
                //console.log('elementsBefore',elementsBefore);
                this.documentService.breadCrumbArray = elementsBefore;
                this.breadCrumbArray = this.documentService.breadCrumbArray;
            }
          }else{
            this.breadCrumbArray = this.documentService.breadCrumbArray;
          }

          this.selectedFolderId = this.parentFolderDetails.id;
          this.documentService.selectedFolderId = this.selectedFolderId;

          this.dataSource.loadLinkdocuemnts(this.documentResource);
          //console.log(this.parentfolderId);
        },
      );
  }

  onDocumentView(document: DocumentInfo) {
    const urls = document.url.split('.');
    const extension = urls[1];
    const documentView: DocumentView = {
      documentId: document.id,
      name: document.name,
      extension: extension,
      isRestricted: document.isAllowDownload,
      isVersion: false,
      isFromPreview: (this.allowType == 2)? true : false,
      createdBy: this.linkDetails['createdBy'],
      is_anonymous: 1
    };
    this.overlay.open(BasePreviewComponent, {
      position: 'center',
      origin: 'global',
      panelClass: ['file-preview-overlay-container', 'white-background'],
      data: documentView,
    });
  }
}
