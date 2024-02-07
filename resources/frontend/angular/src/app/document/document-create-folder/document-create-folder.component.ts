import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, AbstractControl,ValidationErrors } from '@angular/forms';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { DocumentService } from '../document.service';
import { CreateFolder } from '@core/domain-classes/document-create-folder';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-document-create-folder',
  templateUrl: './document-create-folder.component.html',
  styleUrls: ['./document-create-folder.component.scss']
})
export class DocumentCreateFolderComponent extends BaseComponent implements OnInit {
  createFolder: UntypedFormGroup;
  public editor: any = ClassicEditor;
  isLoading = false;

  constructor(
    private documentService: DocumentService,
    private fb: UntypedFormBuilder,
    private toastrService: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DocumentInfo,
    private dialogRef: MatDialogRef<DocumentCreateFolderComponent>,
    private commonService: CommonService,
    private translationService: TranslationService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.createCreateFolder();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  createCreateFolder() {
    this.createFolder = this.fb.group({
      folderName: ['', [Validators.required, this.folderNameValidator]],
    });
  }
  folderNameValidator(control: AbstractControl): ValidationErrors | null {
    const forbiddenChars = /[@#%&*()_+/]/;
    if (forbiddenChars.test(control.value)) {
      return { forbiddenChars: true };
    }
    return null;
  }

  create_Folder() {
    if (!this.createFolder.valid) {
      this.createFolder.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.sub$.sink = this.documentService
      .createFolder(this.buildObject())
      .subscribe(() => {
        this.toastrService.success(this.translationService.getValue('FOLDER_CREATED_SUCCESSFULLY'));
        this.isLoading = false;
        this.closeDialog();
        this.documentService.callFunction(this.buildObject().documentId);
      },
      (error) => {
        this.isLoading = false;
      }
      );
  }

  buildObject() {
    const createFolder: CreateFolder = {
      documentId: this.data.parentId,
      folderName: this.createFolder.get('folderName').value,
      type: 'main',
    }
    return createFolder;
  }
}
