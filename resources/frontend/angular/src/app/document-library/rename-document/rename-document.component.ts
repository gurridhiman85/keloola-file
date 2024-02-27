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
  AbstractControl,
  ValidationErrors,
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
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { DocumentLibraryService } from '../document-library.service';
import { CreateFolder } from '@core/domain-classes/document-create-folder';

@Component({
  selector: 'app-rename-document',
  templateUrl: './rename-document.component.html',
  styleUrls: ['./rename-document.component.css'],
})
export class RenameDocumentComponent extends BaseComponent implements OnInit {
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
  uploadAveragePercentage: { folder: string, averageProgress: number } = { folder: '', averageProgress: 0 };

  createFolder: UntypedFormGroup;
  public editor: any = ClassicEditor;
  isLoading = false;

  constructor(
    private documentLibraryService: DocumentLibraryService,
    private fb: UntypedFormBuilder,
    private toastrService: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DocumentInfo,
    private dialogRef: MatDialogRef<RenameDocumentComponent>,
    private commonService: CommonService,
    private translationService: TranslationService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.renameDocument();
    //console.log(this.data);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  renameDocument() {
    console.log('this.data.name',this.data.name)
    this.createFolder = this.fb.group({
      folderName: [this.data.name, [Validators.required, this.folderNameValidator]],
    });
  }

  folderNameValidator(control: AbstractControl): ValidationErrors | null {
    const forbiddenChars = /[*:?"<>|\\/]/;
    if (forbiddenChars.test(control.value)) {
      return { forbiddenChars: true };
    }
    return null;
  }

  create_Folder() {
    //console.log('documentIddocumentId',this.buildObject().documentId);
    if (!this.createFolder.valid) {
      this.createFolder.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.sub$.sink = this.documentLibraryService
      .renameDocument(this.buildObject())
      .subscribe(() => {
        this.toastrService.success(this.translationService.getValue('DOCUMENT_RENAMED_SUCCESSFULLY'));
        this.isLoading = false;
        this.closeDialog();
        this.documentLibraryService.callFunction(this.buildObject().documentId);
      },
      (error) => {
        this.isLoading = false;
      }
      );
  }

  buildObject() {
    //console.log('this.data.id',this.data.id)
    const createFolder: CreateFolder = {
      documentId: this.data.id,
      folderName: this.createFolder.get('folderName').value,
      type: '',
      isPrivate: 0,
    }
    return createFolder;
  }
}
