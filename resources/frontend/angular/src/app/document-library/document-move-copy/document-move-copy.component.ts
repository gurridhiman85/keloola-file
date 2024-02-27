import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  Inject,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { Category } from '@core/domain-classes/category';
import { ResponseHeader } from '@core/domain-classes/document-header';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentResource } from '@core/domain-classes/document-resource';
import { OverlayPanel } from '@shared/overlay-panel/overlay-panel.service';
import { merge, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { DocumentLibraryService } from '../document-library.service';
import { DocumentLibraryDataSource } from './document-library-datasource';
import { SelectionModel } from '@angular/cdk/collections';
import { ClonerService } from '@core/services/clone.service';
import { DocumentService } from 'src/app/document/document.service';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { TranslationService } from '@core/services/translation.service';
import { CommonService } from '@core/services/common.service';
import { ToastrService } from 'ngx-toastr';
import { MatPaginator } from '@angular/material/paginator';
import { DocumentCreateFolderComponent } from '../document-create-folder/document-create-folder.component';
import { childDocumentInfo } from '@core/domain-classes/child-document-info';
import { SecurityService } from '@core/security/security.service';
import { UserAuth } from '@core/domain-classes/user-auth';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-document-move-copy',
  templateUrl: './document-move-copy.component.html',
  styleUrls: ['./document-move-copy.component.scss']
})
export class DocumentMoveCopyComponent
  extends BaseComponent
  implements OnInit, AfterViewInit
{
  dataSource: DocumentLibraryDataSource;
  documents: DocumentInfo[] = [];
  childDocuments: childDocumentInfo[] = [];
  displayedColumns: string[] = [
    'name',
    'categoryName',
    'createdDate',
    'createdBy',
  ];
  isLoadingResults = true;
  documentResource: DocumentResource;
  categories: Category[] = [];
  allCategories: Category[] = [];
  loading$: Observable<boolean>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input') input: ElementRef;
  @ViewChild('metatag') metatag: ElementRef;
  selection = new SelectionModel<DocumentInfo>(true, []);

  parentfolderId:number;
  selectedFolderId: any = null;
  showFolder:string;
  parentFolderDetails:any ={};
  breadCrumbArray: { id: any; name: any; pageIndex: any;skip: any; }[] = [];
  deleteMessage : string;
  userDetails: UserAuth;
  mainPagePaginator:any = [];
  baseUrl : string;
  selectedCategoryId: string = '';
  currentPath : string;
  documentDetails:any;

  constructor(
    private documentLibraryService: DocumentLibraryService,
    public overlay: OverlayPanel,
    public clonerService: ClonerService,
    private documentService: DocumentService,
    private commonService: CommonService,
    private securityService: SecurityService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DocumentCreateFolderComponent>,
    private toastrService: ToastrService,
    private translationService: TranslationService,
  ) {
    super();
    this.documentResource = new DocumentResource();
    this.documentResource.pageSize = 30;
    this.documentResource.orderBy = 'createdDate desc';
    //this.documentLibraryService.setFunction(this.getparentbreadCrumb.bind(this));
    this.documentResource.type = 'folder';
    this.documentDetails = this.data.documentDetails;
    if(this.data.type == "MOVE"){
      this.documentResource.exclude_document = this.documentDetails.id;
    }
  }

  ngOnInit(): void {
    this.dataSource = new DocumentLibraryDataSource(
      this.documentLibraryService
    );
    this.documentResource.is_owner = 1;
    this.dataSource.loadDocuments(this.documentResource);
    this.getResourceParameter();
    this.userDetails = this.securityService.getUserDetail();
    this.mainPagePaginator.pageIndex = 0;
    this.mainPagePaginator.skip = 0;
    if(this.documentDetails.mimeType){
      var urlArray = this.documentDetails.url.split('/');
      urlArray.pop();
      urlArray.push(`${this.documentDetails.name}.${this.documentDetails.mimeType}`);
      this.currentPath = urlArray.join('/');
    }else{
      this.currentPath = this.documentDetails.url;
    }
  }

  ngAfterViewInit() {
    this.sub$.sink = this.sort.sortChange.subscribe(
      () => (this.paginator.pageIndex = 0)
    );

    this.sub$.sink = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => {
          this.documentResource.skip =
            this.paginator.pageIndex * this.paginator.pageSize;
          this.documentResource.pageSize = this.paginator.pageSize;
          this.documentResource.orderBy =
            this.sort.active + ' ' + this.sort.direction;
          this.dataSource.loadDocuments(this.documentResource);

          if(!this.selectedFolderId){
            this.mainPagePaginator.pageIndex = this.paginator.pageIndex;
            this.mainPagePaginator.skip = this.documentResource.skip;
          }else{
            let index = this.breadCrumbArray.findIndex(obj => obj.id === this.selectedFolderId);
            if (index !== -1) {
              this.breadCrumbArray[index].pageIndex = this.paginator.pageIndex;
              this.breadCrumbArray[index].skip = this.documentResource.skip;
            }
          }
        })
      )
      .subscribe();
  }


  getResourceParameter() {
    this.sub$.sink = this.dataSource.responseHeaderSubject$.subscribe(
      (c: ResponseHeader) => {
        if (c) {
          this.documentResource.pageSize = c.pageSize;
          this.documentResource.skip = c.skip;
          this.documentResource.totalCount = c.totalCount;
        }
      }
    );
  }

  getDocuments(): void {
    this.isLoadingResults = true;
    this.sub$.sink = this.documentLibraryService
      .getDocuments(this.documentResource)
      .subscribe(
        (resp: HttpResponse<DocumentInfo[]>) => {
          const paginationParam = JSON.parse(
            resp.headers.get('X-Pagination')
          ) as ResponseHeader;
          this.documentResource.pageSize = paginationParam.pageSize;
          this.documentResource.skip = paginationParam.skip;
          this.documents = [...resp.body];
          this.isLoadingResults = false;
        },
        () => (this.isLoadingResults = false)
      );
  }

  getbreadCrumb(data){
    if(!data.mimeType){
      this.paginator.pageIndex = 0;
      this.parentfolderId = data.parentId;

      //mainting the breadCrumb and each partner folders opening page number and skip count
      this.breadCrumbArray.push({ id: data.id, name: data.name, pageIndex : this.paginator.pageIndex, skip : 0});

      this.parentfolderId = data.parentId;
      // this.breadCrumbArray = this.documentService.breadCrumbArray;
      this.documentResource.parentId = data.id;
      this.documentResource.skip = 0;
      this.selectedFolderId = data.id;
      // this.documentService.selectedFolderId = this.selectedFolderId;
      this.dataSource.loadDocuments(this.documentResource);
    }
  }
  getparentbreadCrumb(parentfolderId,back){
    // console.log('parentfolderId',parentfolderId);
    if(parentfolderId){
      this.documentResource.parentId = parentfolderId;
      this.documentResource.skip = 0;
      this.getDocument(parentfolderId,back);
    }else{
      // pagination set
      //mainting the breadCrumb and each partner folders opening page number and skip count
      this.paginator.pageIndex = this.mainPagePaginator.pageIndex;
      this.documentResource.skip = this.mainPagePaginator.skip;

      this.breadCrumbArray.pop();
      this.documentResource.parentId = '';
      this.selectedFolderId = null;
      // this.documentService.selectedFolderId = this.selectedFolderId;
      this.dataSource.loadDocuments(this.documentResource);
    }
  }

  getDocument(parentfolderId,back): void {
    this.documentLibraryService
      .getDocument(parentfolderId)
      .subscribe(
        (resp: HttpResponse<DocumentInfo[]>) => {
          this.parentFolderDetails = resp;
          this.parentfolderId = this.parentFolderDetails.parentId;

          if(back){
            this.breadCrumbArray.pop();
            //this.breadCrumbArray = this.documentService.breadCrumbArray;
          }else{
            //this will create the breadcrumb of clicked folder
            let targetObject = { id: this.parentFolderDetails.id, name: this.parentFolderDetails.name };
            // Finding the index of the target object in the array
            let index = this.breadCrumbArray.findIndex(obj => obj.id === targetObject.id);
            // Extracting elements before the target object
            if (index !== -1) {
                // let elementsBefore = this.breadCrumbArray.slice(0, index+1);
                // this.breadCrumbArray = elementsBefore;
                let elementsBefore = this.breadCrumbArray.slice(0, index+1);
                this.breadCrumbArray = elementsBefore;
            }
          }
          this.selectedFolderId = this.parentFolderDetails.id;
          // pagination set
          //mainting the breadCrumb and each partner folders opening page number and skip count
          const lastElement = this.breadCrumbArray[this.breadCrumbArray.length - 1];
          if(lastElement){
            this.paginator.pageIndex = lastElement.pageIndex;
            this.documentResource.skip = lastElement.skip;
          }else{
            this.paginator.pageIndex = 0;
            this.documentResource.skip = 0;
          }


          // this condition will only need inside assigned flow

          if(this.breadCrumbArray.length < 1){
            this.documentResource.parentId = '';
            this.documentResource.skip = 0;
            this.selectedFolderId = null;
          }
          this.documentService.selectedFolderId = this.selectedFolderId;

          this.dataSource.loadDocuments(this.documentResource);
        },
      );
  }
  documentMoveCopyAction(){
    var selectedFolderId = this.selectedFolderId;
    this.sub$.sink = this.documentService
      .movecopyDocument(this.documentDetails.id,selectedFolderId,this.data.type)
      .subscribe(() => {
        var operationString =(this.data.type == "COPY") ? DocumentOperation.Copied.toString() : DocumentOperation.Moved.toString();
        //console.log('operationString',operationString)
        this.addDocumentTrail(this.documentDetails.id,operationString);
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  addDocumentTrail(id: string, operation: string) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: id,
      operationName: operation,
    };
    this.sub$.sink = this.commonService
      .addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe(() => {
        this.toastrService.success(
          this.translationService.getValue(
            'DOCUMENT_'+this.data.type+'_SUCCESSFULLY'
          )
        );
        this.dialogRef.close();

      });
  }
}
