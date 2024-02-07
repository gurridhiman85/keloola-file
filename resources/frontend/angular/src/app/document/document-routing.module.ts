import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@core/security/auth.guard';
import { DocumentListComponent } from './document-list/document-list.component';
import { DocumentManageResolver } from './document-manage/document-manage-resolver';
import { DocumentManageComponent } from './document-manage/document-manage.component';

const routes: Routes = [
  {
    path: ':id',
    component: DocumentListComponent,
    data: { claimType: 'ALL_DOCUMENTS_VIEW_DOCUMENTS' },
    canActivate: [AuthGuard],
  },
  {
    path: '',
    component: DocumentListComponent,
    data: { claimType: 'ALL_DOCUMENTS_VIEW_DOCUMENTS' },
    canActivate: [AuthGuard],
  },
  {
    path: 'add/:id',
    component: DocumentManageComponent,
    data: { claimType: 'ALL_DOCUMENTS_CREATE_DOCUMENT' },
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: DocumentManageComponent,
    resolve: {
      document: DocumentManageResolver,
    },
    data: { claimType: 'ALL_DOCUMENTS_EDIT_DOCUMENT' },
    canActivate: [AuthGuard],
  },
  {
    path: 'permission',
    loadChildren: () =>
      import('./document-permission/document-permission.module').then(
        (m) => m.DocumentPermissionModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocumentRoutingModule {}
