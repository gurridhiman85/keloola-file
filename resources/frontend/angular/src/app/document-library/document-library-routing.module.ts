import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DocumentLibraryListComponent } from './document-library-list/document-library-list.component';

const routes: Routes = [
  {
    path: '',
    component: DocumentLibraryListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentLibraryRoutingModule { }
