import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { SendDocument } from '@core/domain-classes/send-document-link';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { EmailSendService } from './email-send.service';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DocumentVerifyLinkInfo } from '@core/domain-classes/document-verify-link';
import {Clipboard} from '@angular/cdk/clipboard';

@Component({
  selector: 'app-send-document-link',
  templateUrl: './send-document-link.component.html',
  styleUrls: ['./send-document-link.component.scss']
})
export class SendDocumentLinkComponent extends BaseComponent implements OnInit {
  emailForm: UntypedFormGroup;
  public editor: any = ClassicEditor;
  isLoading = false;
  minDate: Date;
  linkDetails: DocumentVerifyLinkInfo[] = [];
  document: DocumentInfo;
  link: string;
  showPassword : boolean = false;
  selectedAllowValue : number = 1;
  isAllowedPassword : number;
  oldPassword : string;
  showPasswordString: boolean = false;
  //DocumentVerifyLinkdata: DocumentVerifyLinkInfo;

  constructor(
    private fb: UntypedFormBuilder,
    private toastrService: ToastrService,
    private emailSendService: EmailSendService,
    @Inject(MAT_DIALOG_DATA) public data: DocumentInfo,

    private dialogRef: MatDialogRef<SendDocumentLinkComponent>,
    private commonService: CommonService,
    private translationService: TranslationService,
    private clipboard: Clipboard
  ) {
    super();
    this.minDate = new Date();
  }

  ngOnInit(): void {
    this.generateLink();
    this.createEmailForm();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  generateLink() {
    this.sub$.sink = this.commonService
      .generateFileFolderLink(this.data.id)
      .subscribe((linkDetails: DocumentVerifyLinkInfo[]) => (
        this.linkDetails = linkDetails,
        this.link = this.linkDetails['link'],
        this.selectedAllowValue = this.linkDetails['allowType'],
        this.isAllowedPassword = (this.linkDetails['allowPassword'] == 1) ? 1 : 0,
        this.showPassword = (this.linkDetails['allowPassword'] == 1) ? true : false,
        this.oldPassword = (this.linkDetails['allowPassword'] == 1) ? this.linkDetails['password'] : ''
      ));
  }


  createEmailForm() {
    this.emailForm = this.fb.group({
      link: [{ value: '', disabled: true }, [Validators.required]],
      documentId: [this.data.id, [Validators.required]],
      isTimeBound: new UntypedFormControl(false),
      startDate: [''],
      endDate: [''],
      allowPassword:[''],
      selectedAllowedType:['', [Validators.required]],
      password: ['']
    });
  }

  changePasswordFeature(event: MatCheckboxChange) {

    if (event.checked) {
      this.emailForm.get('password').setValidators([Validators.required]);
      this.emailForm.get('password').updateValueAndValidity();
      this.showPassword = true;
    }else{
      this.emailForm.get('password').clearValidators();
      this.emailForm.get('password').updateValueAndValidity();
      this.showPassword = false;
    }
  }

  timeBoundChange(event: MatCheckboxChange) {
    if (event.checked) {
      this.emailForm.get('startDate').setValidators([Validators.required]);
      this.emailForm.get('endDate').setValidators([Validators.required]);
    } else {
      this.emailForm.get('startDate').clearValidators();
      this.emailForm.get('startDate').updateValueAndValidity();
      this.emailForm.get('endDate').clearValidators();
      this.emailForm.get('endDate').updateValueAndValidity();
    }
  }

  copyDocumentLink() {
    //console.log('DocumentVerifyLinkdata',this.link);
    if (!this.emailForm.valid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.sub$.sink = this.emailSendService.saveDocumentLinkDetails(this.buildObject())
      .subscribe(() => {
        this.addDocumentTrail();
        this.toastrService.success(this.translationService.getValue('LINK_COPIED_SUCCESSFULLY'));
        this.clipboard.copy(this.link);
      }, () => {
        this.isLoading = false;
      });
  }

  buildObject() {
    const sendDocument: SendDocument = {
      documentId: this.emailForm.get('documentId').value,
      // link: this.emailForm.get('link').value,
      startDate: this.emailForm.get('startDate').value,
      endDate: this.emailForm.get('endDate').value,
      allowPassword: this.emailForm.get('allowPassword').value,
      selectedAllowedType: this.emailForm.get('selectedAllowedType').value,
      password: this.emailForm.get('password').value,
      isTimeBound: this.emailForm.get('isTimeBound').value,
    }
    return sendDocument;
  }

  addDocumentTrail() {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: this.data.id,
      operationName: DocumentOperation.Send_Email.toString()
    };
    this.sub$.sink = this.commonService.addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe(c => {
        this.dialogRef.close();
        this.isLoading = false;
      });
  }

  togglePasswordVisibility(): void {
    this.showPasswordString = !this.showPasswordString;
  }

}
