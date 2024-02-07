import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SendDocument } from '@core/domain-classes/send-document-link';
import { CommonError } from '@core/error-handler/common-error';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EmailSendService {

  constructor(private httpClient: HttpClient,
    private commonHttpErrorService: CommonHttpErrorService) { }

    sendDocument(sendDocument: SendDocument): Observable<void | CommonError> {
      const url = 'email_with_file_link';
      return this.httpClient.post<void>(url, sendDocument)
        .pipe(catchError(this.commonHttpErrorService.handleError));
    }
    saveDocumentLinkDetails(sendDocument: SendDocument): Observable<void | CommonError> {
      const url = 'save_document_link_details';
      return this.httpClient.post<void>(url, sendDocument)
        .pipe(catchError(this.commonHttpErrorService.handleError));
    }
}
