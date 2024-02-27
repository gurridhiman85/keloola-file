import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@core/security/auth.guard';
import { MyDocumentListComponent } from './my-document-list/my-document-list.component';
import { DocumentManageResolver } from './document-manage/document-manage-resolver';
import { DocumentManageComponent } from './document-manage/document-manage.component';

const routes: Routes = [
  {
    path: ':id',
    component: MyDocumentListComponent,
    data: { claimType: '' },
    canActivate: [AuthGuard],
  },
  {
    path: '',
    component: MyDocumentListComponent,
    data: { claimType: '' },
    canActivate: [AuthGuard],
  },
  {
    path: 'add/:id/:type',
    component: DocumentManageComponent,
    data: { claimType: '' },
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: DocumentManageComponent,
    resolve: {
      document: DocumentManageResolver,
    },
    data: { claimType: '' },
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
export class MyDocumentRoutingModule {}
