import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { CommonError } from '@core/error-handler/common-error';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { Observable, of } from 'rxjs';
import { User } from '@core/domain-classes/user';
import { catchError } from 'rxjs/operators';
import { Role } from '@core/domain-classes/role';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import {
  reminderFrequencies,
  ReminderFrequency,
} from '@core/domain-classes/reminder-frequency';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentVerifyLinkInfo } from '@core/domain-classes/document-verify-link';

import { ReminderResourceParameter } from '@core/domain-classes/reminder-resource-parameter';
import { Reminder } from '@core/domain-classes/reminder';
import { UserResource } from '@core/domain-classes/user-resource';
import { DocumentService } from '../../document/document.service';

@Injectable({ providedIn: 'root' })
export class CommonService {
  constructor(
    private httpClient: HttpClient,
    private commonHttpErrorService: CommonHttpErrorService,
    private documentService: DocumentService
  ) {}

  getUsers(): Observable<User[] | CommonError> {
    let url = `user`;
    if(this.documentService.privateDocument == 1){
      url = `privateUser`;
    }
    return this.httpClient
      .get<User[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getUsersList(resource: UserResource): Observable<HttpResponse<User[]> | CommonError> {
    const url = `user`;
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
      .set('name', resource.name)
      .set('userName', resource.userName)
      .set('role', resource.role)

    return this.httpClient
      .get<User[]>(url, {
        params: customParams,
        observe: 'response',
      })
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }
  getUsersExceptLoggedIn(): Observable<User[] | CommonError> {
    let url = `user`;
    if(this.documentService.privateDocument == 1){
      url = `privateUser`;
    }
    return this.httpClient
      .get<User[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getRoles(): Observable<Role[] | CommonError> {
    let url = `role`;
    if(this.documentService.privateDocument == 1){
      url = `privateRole`;
    }
    return this.httpClient
      .get<Role[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getMyReminder(id: string): Observable<Reminder | CommonError> {
    const url = `reminder/${id}/myreminder`;
    return this.httpClient
      .get<Reminder>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getReminder(id: string): Observable<Reminder | CommonError> {
    const url = `reminder/${id}`;
    return this.httpClient
      .get<Reminder>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  addDocumentAuditTrail(documentAuditTrail: DocumentAuditTrail): Observable<DocumentAuditTrail  | CommonError> {
    const url = `documentAuditTrail`;
    return this.httpClient.post<DocumentAuditTrail>(url, documentAuditTrail).pipe(catchError(this.commonHttpErrorService.handleError));
    //return this.httpClient.post<DocumentAuditTrail>('documentAuditTrail',documentAuditTrail);
  }
  addDocumentAuditTrailAnonymous(documentAuditTrail: DocumentAuditTrail): Observable<DocumentAuditTrail  | CommonError> {
    const url = `documentAuditTrailAnonymous`;
    return this.httpClient.post<DocumentAuditTrail>(url, documentAuditTrail).pipe(catchError(this.commonHttpErrorService.handleError));
    //return this.httpClient.post<DocumentAuditTrail>('documentAuditTrail',documentAuditTrail);
  }

  downloadDocument(
    documentId: string,
    isVersion: boolean
  ): Observable<HttpEvent<Blob>> {
    const url = `document/${documentId}/download/${isVersion} `;
    return this.httpClient.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob',
    });
  }

  downloadSharedDocument(
    documentId: string,
    isVersion: boolean,
    sharedBy: string
  ): Observable<HttpEvent<Blob>> {
    const url = `shared-document/${documentId}/download/${isVersion}/${sharedBy} `;
    return this.httpClient.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob',
    });
  }

  isDownloadFlag(
    documentId: string,
    isPermission: boolean
  ): Observable<boolean> {
    const url = `document/${documentId}/isDownloadFlag/isPermission/${isPermission}`;
    return this.httpClient.get<boolean>(url);
  }

  getDocumentToken(documentId: string): Observable<{ [key: string]: string }> {
    const url = `documentToken/${documentId}/token`;
    return this.httpClient.get<{ [key: string]: string }>(url);
  }

  deleteDocumentToken(token: string): Observable<boolean> {
    const url = `documentToken/${token}`;
    return this.httpClient.delete<boolean>(url);
  }

  readDocument(
    documentId: string,
    isVersion: boolean
  ): Observable<{ [key: string]: string[] } | CommonError> {
    const url = `document/${documentId}/readText/${isVersion}`;
    return this.httpClient.get<{ [key: string]: string[] }>(url);
  }

  getReminderFrequency(): Observable<ReminderFrequency[]> {
    return of(reminderFrequencies);
  }

  addDocumentWithAssign(document: DocumentInfo): Observable<DocumentInfo | CommonError> {

    document.documentMetaDatas = document.documentMetaDatas?.filter(
      (c) => c.metatag
    );
    const url = `document/assign`;
    const formData = new FormData();
    //formData.append('uploadFile', document.fileData);
    for (let i = 0; i < document.fileData.length; i++) {
      formData.append('uploadFile[]', document.fileData[i]);
    }
    formData.append('name', document.name);
    formData.append('categoryId', document.categoryId);
    formData.append('categoryName', document.categoryName);
    formData.append('description', document.description);
    formData.append('parentId', document.parentId);
    // formData.append('isAllowDownload', document.isAllowDownload.toString());
    formData.append('documentMetaDatas', JSON.stringify(document.documentMetaDatas));

    return this.httpClient.post<DocumentInfo>(url,formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));

  }

  uploadChunk(document: DocumentInfo, file: File, chunkNumber: number, totalChunks: number, filename: string) {
    document.documentMetaDatas = document.documentMetaDatas?.filter(
      (c) => c.metatag
    );

    const url = `document/upload/chunks`;
    const formData = new FormData();
    formData.append('file', file, filename);
    formData.append('chunkNumber', chunkNumber.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('filename', filename);

    formData.append('description', document.description);
    formData.append('parentId', document.parentId);
    formData.append('upload_type', 'toMe');
    if(document.localPath){
      formData.append('localPath', document.localPath);
    }
    formData.append('mainFolder', document.mainFolder);

    formData.append(
      'documentMetaDatas',
      JSON.stringify(document.documentMetaDatas)
    );

    return this.httpClient
      .post<DocumentInfo>(url, formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  checkFolderExitence(document: DocumentInfo){
    const formData = new FormData();
    formData.append('localPath', document.localPath);
    formData.append('parentId', document.parentId);
    formData.append('isPrivate', this.documentService.privateDocument.toString());

    const url = `document/checkFolderExitence`;
    return this.httpClient
      .post<void>(url,formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getAllRemindersForCurrentUser(
    resourceParams: ReminderResourceParameter
  ): Observable<HttpResponse<Reminder[]>> {
    const url = 'reminder/all/currentuser';
    const customParams = new HttpParams()
      .set('Fields', resourceParams.fields ? resourceParams.fields : '')
      .set('OrderBy', resourceParams.orderBy ? resourceParams.orderBy : '')
      .set('PageSize', resourceParams.pageSize.toString())
      .set('Skip', resourceParams.skip.toString())
      .set(
        'SearchQuery',
        resourceParams.searchQuery ? resourceParams.searchQuery : ''
      )
      .set('subject', resourceParams.subject ? resourceParams.subject : '')
      .set('message', resourceParams.message ? resourceParams.message : '')
      .set(
        'frequency',
        resourceParams.frequency ? resourceParams.frequency : ''
      );

    return this.httpClient.get<Reminder[]>(url, {
      params: customParams,
      observe: 'response',
    });
  }

  deleteReminderCurrentUser(reminderId: string): Observable<boolean> {
    const url = `reminder/currentuser/${reminderId}`;
    return this.httpClient.delete<boolean>(url);
  }

  generateFileFolderLink(id: string): Observable<DocumentVerifyLinkInfo[] | CommonError> {
    const url = `getFileFolderLink/${id}`;
    return this.httpClient
      .get<DocumentVerifyLinkInfo[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }
  getverfiylinkDetailsById(id: string): Observable<DocumentVerifyLinkInfo[] | CommonError> {
    const url = `getverfiylinkDetailsById/${id}`;
    return this.httpClient
      .get<DocumentVerifyLinkInfo[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }
  updateCopyMovePermission(isAllow: number, permissionId: string, type: string){
    const formData = new FormData();
    formData.append('isAllow', isAllow.toString());
    formData.append('permissionId', permissionId);
    formData.append('type', type);
    //const url = `documentRolePermission/updateCopyMovePermission`;
    let url = `documentRolePermission/updateCopyMovePermission`;
    if(this.documentService.privateDocument == 1){
      url = `privateDocumentRolePermission/updateCopyMovePermission`;
    }
    return this.httpClient
      .post<void>(url,formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }
}
