import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RoleRoutingModule } from './role-routing.module';
import { RoleListComponent } from './role-list/role-list.component';
import { ManageRoleComponent } from './manage-role/manage-role.component';
import { FormsModule } from '@angular/forms';
import { ManageRolePresentationComponent } from './manage-role-presentation/manage-role-presentation.component';
import { RoleDetailResolverService } from './role-detail.resolver';
import { RoleUsersComponent } from './role-users/role-users.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SharedModule } from '@shared/shared.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  declarations: [
    RoleListComponent,
    ManageRoleComponent,
    ManageRolePresentationComponent,
    RoleUsersComponent,
  ],
  imports: [
    CommonModule,
    RoleRoutingModule,
    FormsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSlideToggleModule,
    DragDropModule,
    SharedModule,
    MatSelectModule,
    MatExpansionModule,
    MatCheckboxModule,
  ],
  providers: [RoleDetailResolverService],
})
export class RoleModule {}
