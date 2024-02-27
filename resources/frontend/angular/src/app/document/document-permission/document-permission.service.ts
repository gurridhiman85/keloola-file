import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DocumentPermission } from '@core/domain-classes/document-permission';
import { DocumentRolePermission } from '@core/domain-classes/document-role-permission';
import { DocumentUserPermission } from '@core/domain-classes/document-user-permission';
import { PermissionUserRole } from '@core/domain-classes/permission-user-role';
import { CommonError } from '@core/error-handler/common-error';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DocumentService } from '../document.service';

@Injectable({
    providedIn: 'root'
})
export class DocumentPermissionService {

    constructor(
        private httpClient: HttpClient,
        private commonHttpErrorService: CommonHttpErrorService,
        private documentService: DocumentService) {
    }

    getDoucmentPermission(id: string): Observable<DocumentPermission[] | CommonError> {
      //console.log('this.documentService.privateDocument',this.documentService.privateDocument)
        let url = `DocumentRolePermission/${id}`;
        if(this.documentService.privateDocument == 1){
          url = `privateDocumentRolePermission/${id}`;
        }
        return this.httpClient.get<DocumentPermission[]>(url)
            .pipe(catchError(this.commonHttpErrorService.handleError));
    }

    deleteDocumentUserPermission(id: string): Observable<void | CommonError> {
        let url = `documentUserPermission/${id}`;
        if(this.documentService.privateDocument == 1){
          url = `privateDocumentUserPermission/${id}`;
        }
        return this.httpClient.delete<void>(url)
            .pipe(catchError(this.commonHttpErrorService.handleError));
    }

    deleteDocumentRolePermission(id: string): Observable<void | CommonError> {
        let url = `documentRolePermission/${id}`;
        if(this.documentService.privateDocument == 1){
          url = `privateDocumentRolePermission/${id}`;
        }
        return this.httpClient.delete<void>(url)
            .pipe(catchError(this.commonHttpErrorService.handleError));
    }

    addDocumentUserPermission(documentUserPermissions: DocumentUserPermission[]): Observable<void | CommonError> {
        //const url = 'documentUserPermission';
        let url = `documentUserPermission`;
        if(this.documentService.privateDocument == 1){
          url = `privateDocumentUserPermission`;
        }
        return this.httpClient.post<void>(url, { documentUserPermissions })
            .pipe(catchError(this.commonHttpErrorService.handleError));
    }

    addDocumentRolePermission(documentRolePermissions: DocumentRolePermission[]): Observable<void | CommonError> {
        let url = `documentRolePermission`;
        if(this.documentService.privateDocument == 1){
          url = `privateDocumentRolePermission`;
        }
        return this.httpClient.post<void>(url, { documentRolePermissions })
            .pipe(catchError(this.commonHttpErrorService.handleError));
    }

    multipleDocumentsToUsersAndRoles(permissionUserRole: PermissionUserRole): Observable<boolean | CommonError>{
      let url = `documentRolePermission/multiple`;
        if(this.documentService.privateDocument == 1){
          url = `privateDocumentRolePermission/multiple`;
        }
      return this.httpClient.post<boolean>(url, permissionUserRole)
          .pipe(catchError(this.commonHttpErrorService.handleError));
    }

}
