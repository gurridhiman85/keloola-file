import { SelectionModel } from '@angular/cdk/collections';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { Category } from '@core/domain-classes/category';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentCategory } from '@core/domain-classes/document-category';
import { ResponseHeader } from '@core/domain-classes/document-header';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { DocumentResource } from '@core/domain-classes/document-resource';
import { DocumentView } from '@core/domain-classes/document-view';
import { DocumentVersion } from '@core/domain-classes/documentVersion';
import { CategoryService } from '@core/services/category.service';
import { ClonerService } from '@core/services/clone.service';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { BasePreviewComponent } from '@shared/base-preview/base-preview.component';
import { OverlayPanel } from '@shared/overlay-panel/overlay-panel.service';
import { ToastrService } from 'ngx-toastr';
import { fromEvent, merge, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { DocumentCommentComponent } from '../document-comment/document-comment.component';
import { DocumentEditComponent } from '../document-edit/document-edit.component';
import { DocumentPermissionListComponent } from '../document-permission/document-permission-list/document-permission-list.component';
import { DocumentPermissionMultipleComponent } from '../document-permission/document-permission-multiple/document-permission-multiple.component';
import { DocumentReminderComponent } from '../document-reminder/document-reminder.component';
import { DocumentUploadNewVersionComponent } from '../document-upload-new-version/document-upload-new-version.component';
import { DocumentVersionHistoryComponent } from '../document-version-history/document-version-history.component';
import { DocumentService } from '../document.service';
import { SendEmailComponent } from '../send-email/send-email.component';
import { DocumentDataSource } from './document-datasource';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DocumentCreateFolderComponent } from '../document-create-folder/document-create-folder.component';
import { DocumentMoveCopyComponent } from '../document-move-copy/document-move-copy.component';
import { Router, ActivatedRoute } from '@angular/router';
import { childDocumentInfo } from '@core/domain-classes/child-document-info';
import { Location } from '@angular/common';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss'],
  viewProviders: [DatePipe]
})
export class DocumentListComponent
  extends BaseComponent
  implements OnInit, AfterViewInit {
  dataSource: DocumentDataSource;
  documents: DocumentInfo[] = [];
  childDocuments: childDocumentInfo[] = [];
  displayedColumns: string[] = [
    'select',
    'action',
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


  createdDate = new FormControl('');

  selection = new SelectionModel<DocumentInfo>(true, []);
  max = new Date();

  parentfolderId:number;
  selectedFolderId: any = null;
  showFolder:any;
  parentFolderDetails:any ={};
  breadCrumbArray: { id: any; name: any; pageIndex: any;skip: any; }[] = [];
  deleteMessage : string;
  baseUrl : string;
  mainPagePaginator:any = [];
  selectedCategoryId: string = '';
  selectedDate: Date;
  allSelectedDownload:any = [];


  constructor(
    private documentService: DocumentService,
    private commonDialogService: CommonDialogService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    public overlay: OverlayPanel,
    public clonerService: ClonerService,
    private translationService: TranslationService,
    private commonService: CommonService,
    private toastrService: ToastrService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) {
    super();
    this.documentResource = new DocumentResource();
    this.documentResource.pageSize = 30;
    this.documentResource.orderBy = 'createdDate desc';
    this.documentService.setFunction(this.getparentbreadCrumb.bind(this));
  }

  ngOnInit(): void {
    this.dataSource = new DocumentDataSource(this.documentService);

    this.route.params.subscribe(params => {
      this.showFolder = params['id'];
      if(this.showFolder){
        this.documentResource.parentId = this.showFolder;
        this.documentResource.skip = 0;
        this.getparentbreadCrumb(this.showFolder,1);

        // Get the current URL segments
        const currentUrlSegments = this.router.url.split('/');
        // Remove the last segment (if there are more than one segments)
        if (currentUrlSegments.length > 1) {
          currentUrlSegments.pop(); // Remove the last segment
          const newUrl = currentUrlSegments.join('/');
          history.replaceState({}, '', newUrl);
        }

      }else{
        this.dataSource.loadDocuments(this.documentResource);
        this.documentService.breadCrumbArray = [];
      }
    });
    this.getCategories();
    this.getResourceParameter();
    this.mainPagePaginator.pageIndex = 0;
    this.mainPagePaginator.skip = 0;
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    this.sub$.sink = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap((c: any) => {
          this.documentResource.skip =
            this.paginator.pageIndex * this.paginator.pageSize;
          this.documentResource.pageSize = this.paginator.pageSize;
          this.documentResource.orderBy =
            this.sort.active + ' ' + this.sort.direction;
          this.dataSource.loadDocuments(this.documentResource);
          this.selection.clear();

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
          this.documentResource.skip = 0;
          this.documentResource.name = this.input.nativeElement.value;
          this.dataSource.loadDocuments(this.documentResource);
          this.selection.clear();
        })
      )
      .subscribe();

    this.sub$.sink = fromEvent(this.metatag.nativeElement, 'keyup')
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.documentResource.skip = 0;
          this.documentResource.metaTags = this.metatag.nativeElement.value;
          this.dataSource.loadDocuments(this.documentResource);
        })
      )
      .subscribe();
    this.sub$.sink = this.createdDate.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap((value: any) => {
          this.paginator.pageIndex = 0;
          this.documentResource.skip = 0;
          if (value) {
            this.documentResource.createDate = new Date(value).toISOString();
          } else {
            this.documentResource.createDate = null;
          }
          this.documentResource.skip = 0;
          this.dataSource.loadDocuments(this.documentResource);
        })
      )
      .subscribe();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
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

  // onCreatedDateChange(event: MatDatepickerInputEvent<Date>) {
  //   if (event.value) {
  //     this.documentResource.createDate = event.value;
  //   } else {
  //     this.documentResource.createDate = null;
  //   }
  //   this.documentResource.skip = 0;
  //   this.dataSource.loadDocuments(this.documentResource);
  // }

  getCategories(): void {
    this.categoryService.getAllCategoriesForDropDown().subscribe((c) => {
      this.categories = [...c];
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

  getDocuments(): void {
    this.isLoadingResults = true;

    this.sub$.sink = this.documentService
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

  editDocument(documentInfo: DocumentInfo) {
    const documentCategories: DocumentCategory = {
      document: documentInfo,
      categories: this.categories,
    };
    const dialogRef = this.dialog.open(DocumentEditComponent, {
      width: '600px',
      data: Object.assign({}, documentCategories),
    });

    this.sub$.sink = dialogRef.afterClosed().subscribe((result: string) => {
      if (result === 'loaded') {
        this.dataSource.loadDocuments(this.documentResource);
      }
    });
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

  manageDocumentPermission(documentInfo: DocumentInfo) {
    this.dialog.open(DocumentPermissionListComponent, {
      data: documentInfo,
      width: '80vw',
      height: '80vh',
    });
  }
  onSharedSelectDocument() {
    const dialogRef = this.dialog.open(DocumentPermissionMultipleComponent, {
      data: this.selection.selected,
      width: '80vw',
      height: '80vh',
    });
    this.sub$.sink = dialogRef.afterClosed().subscribe((result: boolean) => {
      this.selection.clear();
    });
  }

  onDownLoadSelectDocument() {
    for (let i = 0; i < this.selection.selected.length; i++) {
      var selectedDownload = this.selection.selected[i];
      this.allSelectedDownload.push(selectedDownload.id);
        this.addDocumentTrail(
          selectedDownload.id,
          DocumentOperation.Download.toString()
        );
    }
    if(this.allSelectedDownload){
      var allSelectedDownload_json = JSON.stringify(this.allSelectedDownload);
      this.baseUrl = window.location.origin;
      const absoluteUrl = `${this.baseUrl}/download-file/${allSelectedDownload_json}/multiple`;
      window.open(absoluteUrl, '_blank');
      this.allSelectedDownload = [];
    }
  }

  uploadNewVersion(document: Document) {
    const dialogRef = this.dialog.open(DocumentUploadNewVersionComponent, {
      width: '800px',
      maxHeight: '70vh',
      data: Object.assign({}, document),
    });

    this.sub$.sink = dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.dataSource.loadDocuments(this.documentResource);
      }
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

  addDocumentTrail(id: string, operation: string) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: id,
      operationName: operation,
    };
    this.sub$.sink = this.commonService
      .addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe();
  }

  sendEmail(documentInfo: DocumentInfo) {
    this.dialog.open(SendEmailComponent, {
      data: documentInfo,
      width: '80vw',
      height: '80vh',
    });
  }

  addReminder(documentInfo: DocumentInfo) {
    this.dialog.open(DocumentReminderComponent, {
      data: documentInfo,
      width: '80vw',
      height: '80vh',
    });
  }

  onDocumentView(document: DocumentInfo) {
    const urls = document.url.split('.');

    const extension = urls.pop();
    const documentView: DocumentView = {
      documentId: document.id,
      name: document.name,
      extension: extension,
      isRestricted: document.isAllowDownload,
      isVersion: false,
      isFromPreview: true,
    };
    this.overlay.open(BasePreviewComponent, {
      position: 'center',
      origin: 'global',
      panelClass: ['file-preview-overlay-container', 'white-background'],
      data: documentView,
    });
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

  onVersionHistoryClick(document: DocumentInfo): void {
    const documentInfo = this.clonerService.deepClone<DocumentInfo>(document);
    this.sub$.sink = this.documentService
      .getDocumentVersion(document.id)
      .subscribe((documentVersions: DocumentVersion[]) => {
        documentInfo.documentVersions = documentVersions;
        const dialogRef = this.dialog.open(DocumentVersionHistoryComponent, {
          width: '800px',
          maxHeight: '70vh',
          panelClass: 'full-width-dialog',
          data: Object.assign({}, documentInfo),
        });
        dialogRef.afterClosed().subscribe((isRestore: boolean) => {
          if (isRestore) {
            this.dataSource.loadDocuments(this.documentResource);
          }
        });
      });
  }
  getbreadCrumb(data){
    if(!data.mimeType){
      this.resetFilters();
      this.selection.clear();
      this.paginator.pageIndex = 0;
      this.parentfolderId = data.parentId;

      //mainting the breadCrumb and each partner folders opening page number and skip count
      this.documentService.breadCrumbArray.push({ id: data.id, name: data.name, pageIndex : this.paginator.pageIndex, skip : 0});
      this.documentResource.parentId = data.id;
      this.documentResource.skip = 0;
      this.selectedFolderId = data.id;
      this.documentService.selectedFolderId = this.selectedFolderId;
      this.breadCrumbArray = this.documentService.breadCrumbArray;
      this.dataSource.loadDocuments(this.documentResource);
    }
  }
  getparentbreadCrumb(parentfolderId,back){
    if(back != '1'){
      this.resetFilters();
      this.selection.clear();
    }

    if(parentfolderId){
      this.documentResource.parentId = parentfolderId;
      this.documentResource.skip = 0;
      this.getDocument(parentfolderId,back);
    }else{
      // pagination set
      //mainting the breadCrumb and each partner folders opening page number and skip count
      this.paginator.pageIndex = this.mainPagePaginator.pageIndex;
      this.documentResource.skip = this.mainPagePaginator.skip;

      this.documentResource.parentId = '';
      this.breadCrumbArray = [];
      this.documentService.breadCrumbArray = [];
      this.selectedFolderId = 0;
      this.documentService.selectedFolderId = this.selectedFolderId;
      this.dataSource.loadDocuments(this.documentResource);
    }
  }

  getDocument(parentfolderId,back): void {
    this.documentService
      .getDocument(parentfolderId)
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
            // Finding the index of the target object in the array
            let index = this.documentService.breadCrumbArray.findIndex(obj => obj.id === targetObject.id);
            // Extracting elements before the target object
            if (index !== -1) {
                let elementsBefore = this.documentService.breadCrumbArray.slice(0, index+1);
                this.documentService.breadCrumbArray = elementsBefore;
                this.breadCrumbArray = this.documentService.breadCrumbArray;
            }
          }else{
            this.breadCrumbArray = this.documentService.breadCrumbArray;
          }

          // pagination set
          //mainting the breadCrumb and each partner folders opening page number and skip count
          var lastElement = this.documentService.breadCrumbArray[this.documentService.breadCrumbArray.length - 1];
          if(lastElement){
            this.paginator.pageIndex = lastElement.pageIndex;
            this.documentResource.skip = lastElement.skip;
          }


          this.selectedFolderId = this.parentFolderDetails.id;
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
    dialogRef.afterClosed().subscribe((isRestore: boolean) => {
      this.dataSource.loadDocuments(this.documentResource);
    });
  }

  resetFilters(){
    this.input.nativeElement.value = '';
    this.metatag.nativeElement.value = '';
    this.selectedDate = null;
    this.selectedCategoryId = '';

    this.documentResource.categoryId = '';
    this.documentResource.name = this.input.nativeElement.value;
    this.documentResource.metaTags = this.metatag.nativeElement.value;
    this.documentResource.createDate = null;
  }

  documentMoveAction(document: DocumentInfo){
    const dialogRef = this.dialog.open(DocumentMoveCopyComponent, {
      width: '1000px',
      data: {documentDetails : document,type : 'MOVE'}
    });
    dialogRef.afterClosed().subscribe((isRestore: boolean) => {
      this.dataSource.loadDocuments(this.documentResource);
    });
  }
  documentCopyAction(document: DocumentInfo){
    const dialogRef = this.dialog.open(DocumentMoveCopyComponent, {
      width: '1000px',
      data: {documentDetails : document,type : 'COPY'}
    });
    dialogRef.afterClosed().subscribe((isRestore: boolean) => {
      this.dataSource.loadDocuments(this.documentResource);
    });
  }
}
