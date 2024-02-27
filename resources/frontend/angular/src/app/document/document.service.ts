import { HttpClient, HttpParams, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentResource } from '@core/domain-classes/document-resource';
import { DocumentVersion } from '@core/domain-classes/documentVersion';
import { CommonError } from '@core/error-handler/common-error';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateFolder } from '@core/domain-classes/document-create-folder';
import { childDocumentInfo } from '@core/domain-classes/child-document-info';
import { BehaviorSubject } from 'rxjs';
// import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  selectedFolderId: number = 0;
  privateDocument: number = 0;
  breadCrumbArray: { id: any; name: any; pageIndex: any;skip: any;}[] = [];
  fileArrayUpload: any;
  private _uploadPercentageFiles = new BehaviorSubject<any[]>([]);
  private _uploadAveragePercentage = new BehaviorSubject<any[]>([]);
  uploadPercentageFiles$ = this._uploadPercentageFiles.asObservable();
  uploadAveragePercentage$ = this._uploadAveragePercentage.asObservable();
  updateUploadPercentageFiles(files: any[]) {
    this._uploadPercentageFiles.next(files);
  }
  updateUploadAveragePercentage(averagePercentage: any[]) {
    this._uploadAveragePercentage.next(averagePercentage);
  }
  constructor(
    private httpClient: HttpClient,
    private commonHttpErrorService: CommonHttpErrorService
  ) {}

  updateDocument(
    document: DocumentInfo
  ): Observable<DocumentInfo | CommonError> {

    document.documentMetaDatas = document.documentMetaDatas?.filter(
      (c) => c.metatag
    );

    let url = `document/${document.id}`;
    if(this.privateDocument == 1){
      url = `privateDocument/${document.id}`;
    }
    return this.httpClient
      .put<DocumentInfo>(url, document)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  addDocument(document: DocumentInfo): Observable<DocumentInfo | CommonError> {
    document.documentMetaDatas = document.documentMetaDatas?.filter(
      (c) => c.metatag
    );
    const url = `document`;
    const formData = new FormData();
    for (let i = 0; i < document.fileData.length; i++) {
      formData.append('uploadFile[]', document.fileData[i]);
    }
    // formData.append('uploadFile', document.fileData);
    formData.append('name', document.name);
    //formData.append('categoryId', document.categoryId);
    formData.append('categoryName', document.categoryName);
    formData.append('description', document.description);
    formData.append('parentId', document.parentId);
    // formData.append('isAllowDownload', document.isAllowDownload.toString());
    formData.append(
      'documentMetaDatas',
      JSON.stringify(document.documentMetaDatas)
    );

    return this.httpClient
      .post<DocumentInfo>(url, formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  uploadChunk(document: DocumentInfo, file: File, chunkNumber: number, totalChunks: number, filename: string, privateUpload: any) {
    document.documentMetaDatas = document.documentMetaDatas?.filter(
      (c) => c.metatag
    );
    let url = `document/upload/chunks`;
    if(privateUpload == 1){
      url = `privateDocuments/upload/chunks`;
    }

    const formData = new FormData();
    formData.append('file', file, filename);
    formData.append('chunkNumber', chunkNumber.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('filename', filename);

    formData.append('description', document.description);
    formData.append('parentId', document.parentId);
    formData.append('upload_type', 'all');
    if(document.localPath){
      formData.append('localPath', document.localPath);
      formData.append('mainFolder', document.mainFolder);
    }
    formData.append('isPrivate', privateUpload);
    formData.append(
      'documentMetaDatas',
      JSON.stringify(document.documentMetaDatas)
    );

    const headers = new HttpHeaders({
      'Accept': 'application/json',
    });

    const params = new HttpParams();

    const options = {
      headers: headers,
      params: params,
      reportProgress: true,
    };

    return this.httpClient
      .post<DocumentInfo>(url, formData, options)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  deleteDocument(id: string): Observable<void | CommonError> {
    let url = `document/${id}`;
    if(this.privateDocument == 1){
      url = `privateDocuments/${id}`;
    }
    return this.httpClient
      .delete<void>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getDocument(id: string): Observable<DocumentInfo | CommonError> {
    const url = `document/${id}/without_assign`;
    return this.httpClient
      .get<DocumentInfo>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }
  getLinkDocument(id: string): Observable<DocumentInfo | CommonError> {
    //console.log('iddddddddd',id)
    const url = `link-docuemnt/${id}/link-document`;
    return this.httpClient
      .get<DocumentInfo>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getDocuments(
    resource: DocumentResource
  ): Observable<HttpResponse<DocumentInfo[]> | CommonError> {
    let url = `documents`;
    if(this.privateDocument == 1){
      url = `privateDocuments`;
    }
    const customParams = new HttpParams()
      .set('Fields', resource.fields)
      .set('OrderBy', resource.orderBy)
      .set(
        'createDateString',
        resource.createDate ? resource.createDate.toString() : ''
      )
      .set('PageSize', resource.pageSize.toString())
      .set('Skip', resource.skip.toString())
      .set('SearchQuery', resource.searchQuery)
      .set('categoryId', resource.categoryId)
      .set('name', resource.name)
      .set('metaTags', resource.metaTags)
      .set('id', resource.id.toString())
      .set('parentId', resource.parentId.toString())
      .set('document_type', resource.type)
      .set('exclude_document', resource.exclude_document)
      .set('is_owner', resource.is_owner);

    return this.httpClient
      .get<DocumentInfo[]>(url, {
        params: customParams,
        observe: 'response',
      })
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getLinkDocuemnts(
    resource: DocumentResource
  ): Observable<HttpResponse<DocumentInfo[]> | CommonError> {
    const url = `link-docuemnts`;
    const customParams = new HttpParams()
      .set('Fields', resource.fields)
      .set('OrderBy', resource.orderBy)
      .set(
        'createDateString',
        resource.createDate ? resource.createDate.toString() : ''
      )
      .set('PageSize', resource.pageSize.toString())
      .set('Skip', resource.skip.toString())
      .set('SearchQuery', resource.searchQuery)
      .set('categoryId', resource.categoryId)
      .set('name', resource.name)
      .set('metaTags', resource.metaTags)
      .set('id', resource.id.toString())
      .set('parentId', resource.parentId.toString());

    return this.httpClient
      .get<DocumentInfo[]>(url, {
        params: customParams,
        observe: 'response',
      })
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }



  saveNewVersionDocument(document): Observable<DocumentInfo | CommonError> {
    let url = `documentversion`;
    if(this.privateDocument == 1){
      url = `privatedocumentversion`;
    }
    const formData = new FormData();
    formData.append('uploadFile', document.fileData);
    formData.append('documentId', document.documentId);
    return this.httpClient
      .post<DocumentInfo>(url, formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getDocumentVersion(id: string) {
    let url = `documentversion/${id}`;
    if(this.privateDocument == 1){
      url = `privatedocumentversion/${id}`;
    }
    return this.httpClient
      .get<DocumentVersion[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  restoreDocumentVersion(id: string, versionId: string) {
    let url = `documentversion/${id}/restore/${versionId}`;
    if(this.privateDocument == 1){
      url = `privatedocumentversion/${id}/restore/${versionId}`;
    }
    return this.httpClient
      .post<boolean>(url, {})
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getdocumentMetadataById(id: string) {
    let url = `document/${id}/getMetatag`;
    if(this.privateDocument == 1){
      url = `privatedocument/${id}/getMetatag`;
    }
    return this.httpClient
      .get(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
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

  getChildDocumentsOwner(id: string): Observable<DocumentInfo | CommonError> {
    const url = `getChildDocumentsOwner/${id}`;
    return this.httpClient
      .get<childDocumentInfo>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }
  movecopyDocument(documentId: string, toFolder, type: string){
    const url = `movecopyDocument`;
    const formData = new FormData();
    formData.append('documentId', documentId);
    formData.append('toFolder', toFolder);
    formData.append('type', type);
    formData.append('isPrivate', this.privateDocument.toString());

    return this.httpClient
      .post<void>(url, formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

}
