import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  UntypedFormGroup,
  FormArray,
  UntypedFormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { Category } from '@core/domain-classes/category';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentMetaData } from '@core/domain-classes/documentMetaData';
import { FileInfo } from '@core/domain-classes/file-info';
import { CategoryService } from '@core/services/category.service';
import { environment } from '@environments/environment';
import { BaseComponent } from 'src/app/base.component';
import { DocumentService } from '../document.service';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { catchError } from 'rxjs/operators';


@Component({
  selector: 'app-document-manage-presentation',
  templateUrl: './document-manage-presentation.component.html',
  styleUrls: ['./document-manage-presentation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentManagePresentationComponent
  extends BaseComponent
  implements OnInit
{
  document: DocumentInfo;
  documentForm: UntypedFormGroup;
  extension: string = '';
  categories: Category[] = [];
  allCategories: Category[] = [];
  @Input() loading: boolean;
  @Input() privateUpload: any;
  documentSource: string;
  @Output() onSaveDocument: EventEmitter<DocumentInfo> =
    new EventEmitter<DocumentInfo>();
    // @Input() uploadPercentagefiles: any;
  // progress: number = 0;
  message: string = '';
  fileInfo: FileInfo;
  // showProgress: boolean = false;
  // isFileUpload: boolean = false;
  fileArray: any;
  selectedDocumentType: string = 'FILE';
  validDocumentField:boolean = true;
  uploadPercentagefiles:any;
  uploadAveragePercentage:any;

  get documentMetaTagsArray(): FormArray {
    return <FormArray>this.documentForm.get('documentMetaTags');
  }

  constructor(
    private fb: UntypedFormBuilder,
    private httpClient: HttpClient,
    private categoryService: CategoryService,
    private documentService: DocumentService,
    private commonHttpErrorService: CommonHttpErrorService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.createDocumentForm();
    this.getCategories();
    this.documentMetaTagsArray.push(this.buildDocumentMetaTag());

    this.documentService.uploadPercentageFiles$.subscribe((files) => {
      this.uploadPercentagefiles = files;
      this.cdr.detectChanges();
    });
    this.documentService.uploadAveragePercentage$.subscribe((uploadAveragePercentage) => {
      this.uploadAveragePercentage = uploadAveragePercentage;
      this.cdr.detectChanges();
    });
  }

  getCategories() {
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

  onDocumentChange($event: any) {
    const files = $event.target.files || $event.srcElement.files;
    const file_url = files[0];
    this.extension = file_url.name.split('.').pop();
    if (this.fileExtesionValidation(this.extension)) {
      var reader = new FileReader();
      reader.onload = (e: any) => {
        this.documentSource = e.target.result;
        this.fileUploadValidation('upload');
      };
      reader.readAsDataURL(file_url);
    } else {
      this.documentSource = null;
      this.fileUploadValidation('');
    }
  }

  fileUploadValidation(fileName: string) {
    this.documentForm.patchValue({
      url: fileName,
    });
    // this.documentForm.get('url').markAsTouched();
    this.documentForm.updateValueAndValidity();
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
    //this.documentForm.get('extension').markAsTouched();
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
      parentId: [''],
      documentType:['', [Validators.required]],
      //fileArray:[this.fileArray, [Validators.required]]
    });
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
    this.validDocumentField = true;
    if (this.documentForm.valid) {
      if(!this.fileArray || this.fileArray.length == 0){
        this.validDocumentField = false;
      }else{
        this.onSaveDocument.emit(this.buildDocumentObject());
      }
    } else {
      this.markFormGroupTouched(this.documentForm);
    }
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
      parentId: this.documentService.selectedFolderId,
      documentType: this.selectedDocumentType,
    };
    return document;
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

  upload(files) {
    if (files.length === 0) return;
    const formData = new FormData();
    this.fileArray = files;
  }

  filesPicked(files) {
    this.fileUploadExtensionValidation('valid');
    this.fileUploadSizeValidation('valid');
    const formData = new FormData();
    this.fileArray = files;
  }

}
