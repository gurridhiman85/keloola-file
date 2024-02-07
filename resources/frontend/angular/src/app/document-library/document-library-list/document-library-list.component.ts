import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { Category } from '@core/domain-classes/category';
import { ResponseHeader } from '@core/domain-classes/document-header';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentResource } from '@core/domain-classes/document-resource';
import { CategoryService } from '@core/services/category.service';
import { OverlayPanel } from '@shared/overlay-panel/overlay-panel.service';
import { fromEvent, merge, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { DocumentLibraryService } from '../document-library.service';
import { DocumentLibraryDataSource } from './document-library-datasource';
import { SelectionModel } from '@angular/cdk/collections';
import { BasePreviewComponent } from '@shared/base-preview/base-preview.component';
import { DocumentView } from '@core/domain-classes/document-view';
import { DocumentReminderComponent } from '../document-reminder/document-reminder.component';
import { AddDocumentComponent } from '../add-document/add-document.component';
import { ReminderListComponent } from '../reminder-list/reminder-list.component';
import { DocumentCommentComponent } from 'src/app/document/document-comment/document-comment.component';
import { ClonerService } from '@core/services/clone.service';
import { DocumentVersion } from '@core/domain-classes/documentVersion';
import { DocumentVersionHistoryComponent } from 'src/app/document/document-version-history/document-version-history.component';
import { DocumentService } from 'src/app/document/document.service';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { TranslationService } from '@core/services/translation.service';
import { CommonService } from '@core/services/common.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { DocumentCreateFolderComponent } from '../document-create-folder/document-create-folder.component';
import { childDocumentInfo } from '@core/domain-classes/child-document-info';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { SendDocumentLinkComponent } from '../../document/send-document-link/send-document-link.component';
import { SecurityService } from '@core/security/security.service';
import { UserAuth } from '@core/domain-classes/user-auth';
import { DocumentMoveCopyComponent } from '../document-move-copy/document-move-copy.component';

@Component({
  selector: 'app-document-library-list',
  templateUrl: './document-library-list.component.html',
  styleUrls: ['./document-library-list.component.scss'],
})
export class DocumentLibraryListComponent
  extends BaseComponent
  implements OnInit, AfterViewInit
{
  dataSource: DocumentLibraryDataSource;
  documents: DocumentInfo[] = [];
  childDocuments: childDocumentInfo[] = [];
  displayedColumns: string[] = [
    'action',
    'name',
    'categoryName',
    'createdDate',
    'expiredDate',
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

  constructor(
    private documentLibraryService: DocumentLibraryService,
    private categoryService: CategoryService,
    public overlay: OverlayPanel,
    public clonerService: ClonerService,
    private documentService: DocumentService,
    private translationService: TranslationService,
    private commonService: CommonService,
    private toastrService: ToastrService,
    private dialog: MatDialog,
    private commonDialogService: CommonDialogService,
    private securityService: SecurityService,
  ) {
    super();
    this.documentResource = new DocumentResource();
    this.documentResource.pageSize = 30;
    this.documentResource.orderBy = 'createdDate desc';
    this.documentLibraryService.setFunction(this.getparentbreadCrumb.bind(this));
  }

  ngOnInit(): void {
    this.dataSource = new DocumentLibraryDataSource(
      this.documentLibraryService
    );
    this.dataSource.loadDocuments(this.documentResource);
    this.getCategories();
    this.getResourceParameter();
    this.userDetails = this.securityService.getUserDetail();
    this.mainPagePaginator.pageIndex = 0;
    this.mainPagePaginator.skip = 0;
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
            let index = this.documentService.breadCrumbArray.findIndex(obj => obj.id === this.selectedFolderId);
            if (index !== -1) {
              this.documentService.breadCrumbArray[index].pageIndex = this.paginator.pageIndex;
              this.documentService.breadCrumbArray[index].skip = this.documentResource.skip;
            }
          }
        })
      )
      .subscribe();

    this.sub$.sink = fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.documentResource.name = this.input.nativeElement.value;
          this.dataSource.loadDocuments(this.documentResource);
        })
      )
      .subscribe();

    this.sub$.sink = fromEvent(this.metatag.nativeElement, 'keyup')
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.documentResource.metaTags = this.metatag.nativeElement.value;
          this.dataSource.loadDocuments(this.documentResource);
        })
      )
      .subscribe();
  }

  onCategoryChange(filtervalue: any) {
    if (filtervalue.value) {
      this.documentResource.categoryId = filtervalue.value;
    } else {
      this.documentResource.categoryId = '';
    }
    this.documentResource.skip = 0;
    this.dataSource.loadDocuments(this.documentResource);
  }

  getCategories(): void {
    this.categoryService.getAllCategoriesForDropDown().subscribe((c) => {
      this.categories = c;
      this.setDeafLevel();
    });
  }

  setDeafLevel(parent?: Category, parentId?: string) {
    const children = this.categories.filter((c) => c.parentId == parentId);
    if (children.length > 0) {
      children.map((c, index) => {
        c.deafLevel = parent ? parent.deafLevel + 1 : 0;
        c.index =
          (parent ? parent.index : 0) + index * Math.pow(0.1, c.deafLevel);
        this.allCategories.push(c);
        this.setDeafLevel(c, c.id);
      });
    }
    return parent;
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

  getExpiryDate(
    maxRolePermissionEndDate: Date,
    maxUserPermissionEndDate: Date
  ) {
    if (maxRolePermissionEndDate && maxUserPermissionEndDate) {
      return maxRolePermissionEndDate > maxUserPermissionEndDate
        ? maxRolePermissionEndDate
        : maxUserPermissionEndDate;
    } else if (maxRolePermissionEndDate) {
      return maxRolePermissionEndDate;
    } else if (maxUserPermissionEndDate) {
      return maxUserPermissionEndDate;
    } else {
      return null;
    }
  }

  addReminder(documentInfo: DocumentInfo) {
    this.dialog.open(DocumentReminderComponent, {
      data: documentInfo,
      width: '80vw',
      height: '80vh',
    });
  }

  onReminderList() {
    this.dialog.open(ReminderListComponent, {
      data: null,
      width: '80vw',
      maxHeight: '80vh',
    });
  }

  onAddDocument(parentfolderId) {
    const dialogRef = this.dialog.open(AddDocumentComponent, {
      data: { parentId: parentfolderId },
      width: '80vw',
      maxHeight: '80vh',
    });

    this.sub$.sink = dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.dataSource.loadDocuments(this.documentResource);
      }
    });
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
      isFromPreview: false,
    };
    this.overlay.open(BasePreviewComponent, {
      position: 'center',
      origin: 'global',
      panelClass: ['file-preview-overlay-container', 'white-background'],
      data: documentView,
    });
  }

  addDocumentTrail(id: string, operation: string) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: id,
      operationName: operation,
    };
    this.sub$.sink = this.commonService
      .addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe((c) => {});
  }

  private downloadFile(data: HttpResponse<Blob>, documentInfo: DocumentInfo) {
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

  addComment(document: Document) {
    const dialogRef = this.dialog.open(DocumentCommentComponent, {
      width: '800px',
      maxHeight: '70vh',
      data: Object.assign({}, document),
    });

    this.sub$.sink = dialogRef.afterClosed().subscribe((result: string) => {
      if (result === 'loaded') {
        this.dataSource.loadDocuments(this.documentResource);
      }
    });
  }

  onVersionHistoryClick(document: DocumentInfo): void {
    let isAssignUser = true;
    let documentInfo = this.clonerService.deepClone<DocumentInfo>(document);
    this.sub$.sink = this.documentService
      .getDocumentVersion(document.id)
      .subscribe((documentVersions: DocumentVersion[]) => {
        documentInfo.documentVersions = documentVersions;
        this.dialog.open(DocumentVersionHistoryComponent, {
          width: '800px',
          maxHeight: '70vh',
          panelClass: 'full-width-dialog',
          data: Object.assign(documentInfo, { isAssignUser }),
        });
      });
  }
  getbreadCrumb(data){
    if(!data.mimeType){
      this.resetFilters();
      this.paginator.pageIndex = 0;
      this.parentfolderId = data.parentId;

      //mainting the breadCrumb and each partner folders opening page number and skip count
      this.documentService.breadCrumbArray.push({ id: data.id, name: data.name, pageIndex : this.paginator.pageIndex, skip : 0});

      this.parentfolderId = data.parentId;
      this.breadCrumbArray = this.documentService.breadCrumbArray;
      this.documentResource.parentId = data.id;
      this.documentResource.skip = 0;
      this.selectedFolderId = data.id;
      this.documentService.selectedFolderId = this.selectedFolderId;
      this.dataSource.loadDocuments(this.documentResource);
    }
  }
  getparentbreadCrumb(parentfolderId,back){
    this.resetFilters();
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
      this.documentService.selectedFolderId = this.selectedFolderId;
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
            this.documentService.breadCrumbArray.pop();
            this.breadCrumbArray = this.documentService.breadCrumbArray;
          }else{
            //this will create the breadcrumb of clicked folder
            let targetObject = { id: this.parentFolderDetails.id, name: this.parentFolderDetails.name };
            // Finding the index of the target object in the array
            let index = this.breadCrumbArray.findIndex(obj => obj.id === targetObject.id);
            // Extracting elements before the target object
            if (index !== -1) {
                // let elementsBefore = this.breadCrumbArray.slice(0, index+1);
                // this.breadCrumbArray = elementsBefore;
                let elementsBefore = this.documentService.breadCrumbArray.slice(0, index+1);
                this.documentService.breadCrumbArray = elementsBefore;
                this.breadCrumbArray = this.documentService.breadCrumbArray;
            }
          }

          this.selectedFolderId = this.parentFolderDetails.id;

          // pagination set
          //mainting the breadCrumb and each partner folders opening page number and skip count
          console.log('this.breadCrumbArray.length',this.breadCrumbArray);
          const lastElement = this.documentService.breadCrumbArray[this.documentService.breadCrumbArray.length - 1];
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
  createNewFolder(parentfolderId): void {
    const dialogRef = this.dialog.open(DocumentCreateFolderComponent, {
      width: '600px',
      data: { parentId: parentfolderId }
    });
  }

  hasOtherValue(array, value) {
    array = Object.values(array);
    return !array.every(item => item === value);
  }

  deleteDocumentOwnerScan(document: DocumentInfo) {
    this.deleteMessage = '';
    if(!document['mimeType']){
      this.documentService
      .getChildDocumentsOwner(document['id'])
      .subscribe(
        (resp: HttpResponse<childDocumentInfo[]>) => {
          if(resp['childOwners'] && Object.values(resp['childOwners']).length > 0){
            var result = this.hasOtherValue(resp['childOwners'],resp['loggedInUser']);
            if(result){
              this.deleteMessage = 'THIS_DOCUMENT_CONTAINS_FILES_OR_FOLDER_OWNED_BY_OTHER';
            }
            if(resp['loggedInUser'] != document['createdBy']){
              this.deleteMessage = 'THIS_DOCUMENT_IS_OWNED_BY_OTHER';
            }
            this.deleteDocument(document);
          }else{
            if(resp['loggedInUser'] != document['createdBy']){
              this.deleteMessage = 'THIS_DOCUMENT_IS_OWNED_BY_OTHER';
            }
            this.deleteDocument(document);
          }
        },
      );
    }else{
      this.deleteDocument(document);
    }
  }

  deleteDocument(document: DocumentInfo) {
    this.sub$.sink = this.commonDialogService
      .deleteConformationDialog(
        `${this.translationService.getValue(
          'ARE_YOU_SURE_YOU_WANT_TO_DELETE'
        )} ${document.name} ${this.deleteMessage}`
      )
      .subscribe((isTrue: boolean) => {
        if (isTrue) {
          this.sub$.sink = this.documentService
            .deleteDocument(document.id)
            .subscribe(() => {
              this.addDocumentTrail(
                document.id,
                DocumentOperation.Deleted.toString()
              );
              this.toastrService.success(
                this.translationService.getValue(
                  'DOCUMENT_DELETED_SUCCESSFULLY'
                )
              );
              this.dataSource.loadDocuments(this.documentResource);
            });
        }
      });
  }

  sendDocumentViaLink(document: DocumentInfo): void {
    const dialogRef = this.dialog.open(SendDocumentLinkComponent, {
      width: '600px',
      data: document,
    });

    this.sub$.sink = dialogRef.afterClosed().subscribe((result: Screen) => {
    });
  }

  downloadDocument(documentInfo: DocumentInfo) {
    this.baseUrl = window.location.origin;
    const absoluteUrl = `${this.baseUrl}/download-file/${documentInfo.id}`;
    // Open the absolute URL in a new tab for download
    window.open(absoluteUrl, '_blank');
    this.addDocumentTrail(
      documentInfo.id,
      DocumentOperation.Download.toString()
    );
  }
  resetFilters(){
    this.input.nativeElement.value = '';
    this.metatag.nativeElement.value = '';
    this.selectedCategoryId = '';

    this.documentResource.categoryId = '';
    this.documentResource.name = this.input.nativeElement.value;
    this.documentResource.metaTags = this.metatag.nativeElement.value;
  }
  documentMoveAction(document: DocumentInfo){
    const dialogRef = this.dialog.open(DocumentMoveCopyComponent, {
      width: '1000px',
      data: {documentDetails : document,type : 'MOVE',from_module : 'assigned'}
    });
    dialogRef.afterClosed().subscribe((isRestore: boolean) => {
      this.dataSource.loadDocuments(this.documentResource);
    });
  }
  documentCopyAction(document: DocumentInfo){
    const dialogRef = this.dialog.open(DocumentMoveCopyComponent, {
      width: '1000px',
      data: {documentDetails : document,type : 'COPY',from_module : 'assigned'}
    });
    dialogRef.afterClosed().subscribe((isRestore: boolean) => {
      this.dataSource.loadDocuments(this.documentResource);
    });
  }
}
