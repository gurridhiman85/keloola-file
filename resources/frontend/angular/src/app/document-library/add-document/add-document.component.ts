import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  Inject
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormArray,
  FormGroup,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Category } from '@core/domain-classes/category';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { DocumentMetaData } from '@core/domain-classes/documentMetaData';
import { FileInfo } from '@core/domain-classes/file-info';
import { CategoryService } from '@core/services/category.service';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { tap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.css'],
})
export class AddDocumentComponent extends BaseComponent implements OnInit {
  document: DocumentInfo;
  documentForm: UntypedFormGroup;
  extension: string = '';
  categories: Category[] = [];
  allCategories: Category[] = [];
  documentSource: string;
  @Output() onSaveDocument: EventEmitter<DocumentInfo> =
    new EventEmitter<DocumentInfo>();
  progress: number = 0;
  message: string = '';
  fileInfo: FileInfo;
  showProgress: boolean = false;
  isFileUpload: boolean = false;
  fileArray: any;
  maximumFileSizeInMB = 0;
  selectedDocumentType: string = 'FILE';
  validDocumentField:boolean = true;
  mainFolder: any;
  get documentMetaTagsArray(): FormArray {
    return <FormArray>this.documentForm.get('documentMetaTags');
  }
  selectedFolderId:number;
  uploadPercentagefiles: any;
  uploadAveragePercentage: { folder: string, averageProgress: number, averageTimingRemaining: string } = { folder: '', averageProgress: 0, averageTimingRemaining: '' };

  constructor(
    private fb: UntypedFormBuilder,
    private cd: ChangeDetectorRef,
    private categoryService: CategoryService,
    @Inject(MAT_DIALOG_DATA) public data: DocumentInfo,
    private dialogRef: MatDialogRef<AddDocumentComponent>,
    private commonService: CommonService,
    private toastrService: ToastrService,
    private translationService: TranslationService
  ) {
    super();
    this.uploadAveragePercentage = { folder: '', averageProgress: 0, averageTimingRemaining: '' };
  }

  ngOnInit(): void {
    this.maximumFileSizeInMB = environment.maximumFileSizeInMB
    this.getCategories();
    this.createDocumentForm();
    this.documentMetaTagsArray.push(this.buildDocumentMetaTag());
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

  fileUploadSizeValidation(fileSize: string) {
    this.documentForm.patchValue({
      fileSize: fileSize,
    });
    // this.documentForm.get('fileSize').markAsTouched();
    this.documentForm.updateValueAndValidity();
  }

  fileUploadExtensionValidation(extension: string) {
    this.documentForm.patchValue({
      extension: extension,
    });
    // this.documentForm.get('extension').markAsTouched();
    this.documentForm.updateValueAndValidity();
  }

  fileExtesionValidation(extesion: string): boolean {
    const allowExtesions = environment.allowExtesions;
    var allowTypeExtenstion = allowExtesions.find((c) =>
      c.extentions.find((ext) => ext === extesion)
    );
    return allowTypeExtenstion ? true : false;
  }

  createDocumentForm() {
    this.documentForm = this.fb.group({
      description: [''],
      documentMetaTags: this.fb.array([]),
      documentType:['', [Validators.required]],
    });
  }

  upload(files) {
    if (files.length === 0) return;
    this.fileArray = files;
  }

  buildDocumentMetaTag(): FormGroup {
    return this.fb.group({
      id: [''],
      documentId: [''],
      metatag: [''],
    });
  }

  onMetatagChange(event: any, index: number) {
    const email = this.documentMetaTagsArray.at(index).get('metatag').value;
    if (!email) {
      return;
    }
    const emailControl = this.documentMetaTagsArray.at(index).get('metatag');
    emailControl.setValidators([Validators.required]);
    emailControl.updateValueAndValidity();
  }

  editDocmentMetaData(documentMetatag: DocumentMetaData): FormGroup {
    return this.fb.group({
      id: [documentMetatag.id],
      documentId: [documentMetatag.documentId],
      metatag: [documentMetatag.metatag],
    });
  }

  SaveDocument() {
    if (this.documentForm.valid) {
      const document = this.buildDocumentObject();
      if (document.fileArray && document.fileArray.length > 0) {
        if(document.fileArray[0].webkitRelativePath){
          document.localPath = document.fileArray[0].webkitRelativePath;
          this.sub$.sink = this.commonService.checkFolderExitence(document).subscribe((c) => {
            if(c){
              this.mainFolder = c['mainFolder'];
              document.mainFolder = this.mainFolder;
              this.uploadAveragePercentage.folder = this.mainFolder;
              this.uploadChunk(document);
            }
          });
        }else{
          this.uploadChunk(document);
        }
      }else{
        this.validDocumentField = false;
      }
    } else {
      this.markFormGroupTouched(this.documentForm);
    }
  }

  uploadChunk(document){
    const uploadPromises = [];
    this.uploadPercentagefiles = document.fileArray;
    const totalFiles = document.fileArray.length;
    for (let i = 0; i < totalFiles; i++) {
      document.fileData = document.fileArray[i];
      if(document.fileArray[i].webkitRelativePath){
        document.localPath = document.fileArray[i].webkitRelativePath;
      }
      uploadPromises.push(this.uploadFile(document,i));
    }

    Promise.all(uploadPromises).then((result) => {

      this.dialogRef.close(true);
    }).catch((error) => {
      console.log(error.error);
      if(error.error){
        this.toastrService.error(error.error.message);
      }
    });
  }


  async uploadFile(document: DocumentInfo, i: number) {
    var fileData = document.fileData;
    const filename = fileData.name;
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks (adjust as needed)
    const totalSize = fileData.size;
    let offset = 0;

    const totalChunks = Math.ceil(totalSize / chunkSize);
    const startTime = new Date().getTime(); // Record the start time of the upload

    for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
      const chunk = fileData.slice(offset, offset + chunkSize);
      const chunkStartTime = new Date().getTime(); // Record the start time of the chunk upload

      await (this.commonService
        .uploadChunk(document, chunk, chunkNumber, totalChunks, filename) as any) // Use 'as any' to temporarily avoid type issues
        .pipe(
          tap((event: any) => {
            if (event.type === 'UploadProgress') {
              const percentDone = event.loaded;

              this.uploadPercentagefiles[i].progress = percentDone;

              // Calculate upload time for the chunk
              const chunkEndTime = new Date().getTime();
              const chunkUploadTime = (chunkEndTime - chunkStartTime) / 1000;
  
              // Calculate estimated time remaining for upload
              const chunksRemaining = totalChunks - chunkNumber;
              const estimatedTimeRemaining = (chunksRemaining * chunkUploadTime);
              let pendingTimeString;
              let pendingTime;
              if (estimatedTimeRemaining >= 60) {
                  const minutes = Math.floor(estimatedTimeRemaining / 60);
                  const seconds = estimatedTimeRemaining % 60;
                  pendingTimeString = `${minutes.toFixed(0)}.${seconds.toFixed(0)} min`;
                  pendingTime = minutes.toFixed(0)+'.'+seconds.toFixed(0);
              } else {
                  pendingTimeString = `${estimatedTimeRemaining.toFixed(2)} sec`;
                  pendingTime = estimatedTimeRemaining.toFixed(2);
              }
              this.uploadPercentagefiles[i].timingRemainingStr = pendingTimeString;
              this.uploadPercentagefiles[i].timingRemaining = pendingTime;

              // Calculate the average progress
              const arrayOfFiles: File[] = Array.from(this.uploadPercentagefiles);
              const pendingFiles = arrayOfFiles.filter(file => file['progress'] < 100);

              const totalProgress = arrayOfFiles.reduce((sum, file) => sum + (file['progress'] || 0), 0);
              const totalTimingRemaining = arrayOfFiles.reduce((sum, file) => sum + (parseFloat(file['timingRemaining']) || 0), 0);

              const averageProgress = arrayOfFiles.length > 0 ? totalProgress / arrayOfFiles.length : 0;
              const averageTimePending = arrayOfFiles.length > 0 ? totalTimingRemaining / pendingFiles.length : 0;

              let roundedValue = Math.round(averageProgress * 100) / 100;
              roundedValue = Number.isInteger(roundedValue) ? Math.floor(averageProgress) : roundedValue;
              this.uploadAveragePercentage.averageProgress = roundedValue;

              let averagePendingTimeString;
              if (averageTimePending >= 60) {
                  const minutes = Math.floor(averageTimePending / 60);
                  const seconds = averageTimePending % 60;
                  averagePendingTimeString = `${minutes.toFixed(0)}.${seconds.toFixed(0)} min`;
              } else {
                averagePendingTimeString = `${averageTimePending.toFixed(2)} sec`;
              }
              //this.uploadPercentagefiles[i].timingRemaining = averagePendingTimeString;
              //console.log('average time :',averagePendingTimeString);
              this.uploadAveragePercentage.averageTimingRemaining = averagePendingTimeString;
            }
          }),
          filter((event: any) => event.type === 'UploadProgress')
        )
        .toPromise();
      offset += chunkSize;
    }
    this.toastrService.success(fileData.name+' '+
      this.translationService.getValue('DOCUMENT_SAVE_SUCCESSFULLY')
    );
  }

  onAddAnotherMetaTag() {
    const documentMetaTag: DocumentMetaData = {
      id: '',
      documentId: this.document && this.document.id ? this.document.id : '',
      metatag: '',
    };
    this.documentMetaTagsArray.insert(
      0,
      this.editDocmentMetaData(documentMetaTag)
    );
  }

  onDeleteMetaTag(index: number) {
    this.documentMetaTagsArray.removeAt(index);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  addDocumentTrail(id: string) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: id,
      operationName: DocumentOperation.Created.toString(),
    };
    this.sub$.sink = this.commonService
      .addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe((c) => {
        this.toastrService.success(
          this.translationService.getValue('DOCUMENT_SAVE_SUCCESSFULLY')
        );
        this.dialogRef.close(true);
      });
  }

  private markFormGroupTouched(formGroup: UntypedFormGroup) {
    (<any>Object).values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }

  buildDocumentObject(): DocumentInfo {
    const documentMetaTags = this.documentMetaTagsArray.value;
    const document: DocumentInfo = {
      description: this.documentForm.get('description').value,
      url: '',
      documentMetaDatas: [...documentMetaTags],
      fileArray: this.fileArray,
      extension: '',
      parentId: this.data.parentId,
    };
    return document;
  }

  filesPicked(files) {
    this.fileUploadExtensionValidation('valid');
    this.fileUploadSizeValidation('valid');
    const formData = new FormData();
    this.fileArray = files;
  }
}
