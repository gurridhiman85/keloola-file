import { HttpClient, HttpEvent, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentResource } from '@core/domain-classes/document-resource';
import { CommonError } from '@core/error-handler/common-error';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateFolder } from '@core/domain-classes/document-create-folder';

@Injectable({
  providedIn: 'root'
})
export class DocumentLibraryService {
  selectedFolderId: number = 0;
  constructor(private httpClient: HttpClient,
    private commonHttpErrorService: CommonHttpErrorService) { }

  getDocuments(resource: DocumentResource): Observable<HttpResponse<DocumentInfo[]> | CommonError> {
    const url = `document/assignedDocuments`;
    const customParams = new HttpParams()
      .set('Fields', resource.fields)
      .set('OrderBy', resource.orderBy)
      .set('PageSize', resource.pageSize.toString())
      .set('Skip', resource.skip.toString())
      .set('SearchQuery', resource.searchQuery)
      .set('categoryId', resource.categoryId)
      .set('name', resource.name)
      .set('metaTags', resource.metaTags)
      .set('id', resource.id.toString())
      .set('parentId', resource.parentId)
      .set('document_type', resource.type)
      .set('exclude_document', resource.exclude_document)
      .set('is_owner', resource.is_owner);

    return this.httpClient.get<DocumentInfo[]>(url, {
      params: customParams,
      observe: 'response'
    }).pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getDocumentLibrary(id: string): Observable<DocumentInfo> {
    return this.httpClient.get<DocumentInfo>('document/' + id);
  }

  getDocumentViewLibrary(id: string): Observable<DocumentInfo> {
    return this.httpClient.get<DocumentInfo>('document/view/' + id);
  }
  createFolder(createFolder: CreateFolder): Observable<void | CommonError> {
    const url = 'create_folder';
    return this.httpClient.post<void>(url, createFolder)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  functionToCall: any;
  setFunction(fn: any): void {
    this.functionToCall = fn;
  }

  callFunction(id): void {
    if (this.functionToCall) {
      this.functionToCall(id);
    }
  }
  getDocument(id: string): Observable<DocumentInfo | CommonError> {
    //console.log('iddddddddd',id)
    const url = `document/${id}/not_assigned`;
    return this.httpClient
      .get<DocumentInfo>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }
  renameDocument(createFolder: CreateFolder): Observable<void | CommonError> {
    const url = 'rename_document';
    return this.httpClient.post<void>(url, createFolder)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }
}
