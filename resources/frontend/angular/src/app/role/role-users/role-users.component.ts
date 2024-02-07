import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Role } from '@core/domain-classes/role';
import { CommonService } from '@core/services/common.service';
import { User } from '@core/domain-classes/user';
import { UserRoles } from '@core/domain-classes/user-roles';
import { RoleService } from '../role.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';

@Component({
  selector: 'app-role-users',
  templateUrl: './role-users.component.html',
  styleUrls: ['./role-users.component.scss']
})
export class RoleUsersComponent extends BaseComponent implements OnInit {
  roles: Role[];
  allUsers: User[];
  selectedRole: Role = null;
  roleUsers: UserRoles[] = [];
  otherUsers: UserRoles[] = [];
  selectedRoleId: string;
  constructor(
    private commonService: CommonService,
    private roleService: RoleService,
    private toastrService: ToastrService) {
    super();
  }

  ngOnInit(): void {
    this.getRoles();
    this.getUsers();
  }

  addUser(event: CdkDragDrop<UserRoles[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const userRolesToSave = [].concat(this.roleUsers);
      userRolesToSave.push(event.previousContainer.data[event.previousIndex])
      this.sub$.sink = this.roleService.updateRoleUsers(this.selectedRole.id, userRolesToSave).subscribe(() => {
        transferArrayItem(event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex);
        this.toastrService.success(`User Added Successfully to Role ${this.selectedRole.name}`);
      }, () => {
        this.roleUsers.splice(event.previousIndex, 1);
        this.toastrService.error(`Error While Adding User to Role ${this.selectedRole.name}`);
      });
    }
  }

  removeUser(event: CdkDragDrop<UserRoles[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const userRolesToSave = this.roleUsers.filter(d => event.previousContainer.data[event.previousIndex].userId != d.userId);
      this.sub$.sink = this.roleService.updateRoleUsers(this.selectedRole.id, userRolesToSave).subscribe(() => {
        transferArrayItem(event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex);
        this.toastrService.success(`User Removed Successfully from Role ${this.selectedRole.name}`);
      }, () => {
        this.toastrService.error(`Error While Removing User from Role ${this.selectedRole.name}`);
      });
    }
  }

  addAllUser() {
    const userRolesToSave = this.allUsers.map(ds => {
      return {
        userId: ds.id,
        roleId: this.selectedRole.id,
        userName: ds.userName,
        firstName: ds.firstName,
        lastName: ds.lastName
      }
    });
    this.sub$.sink = this.roleService.updateRoleUsers(this.selectedRole.id, userRolesToSave).subscribe(() => {
      this.toastrService.success(`All Users Added Successfully to ${this.selectedRole.name}`);
      this.roleUsers = userRolesToSave;
      this.otherUsers = [];
    });
  }

  removeAllUser() {
    this.sub$.sink = this.roleService.updateRoleUsers(this.selectedRole.id, []).subscribe(() => {
      this.toastrService.success(`All Users Removed Successfully from ${this.selectedRole.name}`);
      this.roleUsers = [];
      this.otherUsers = this.allUsers.map(ds => {
        return {
          userId: ds.id,
          roleId: this.selectedRole.id,
          userName: ds.userName,
          firstName: ds.firstName,
          lastName: ds.lastName
        }
      });
    });
  }

  onRoleChange() {
    this.selectedRole = this.roles.find(c => c.id === this.selectedRoleId);
    this.sub$.sink = this.roleService.getRoleUsers(this.selectedRole.id).subscribe((users: UserRoles[]) => {
      this.roleUsers = users;
      const selectedUserIds = this.roleUsers.map(m => m.userId);
      this.otherUsers = this.allUsers.filter(d => selectedUserIds.indexOf(d.id) < 0)
        .map(ds => {
          return {
            userId: ds.id,
            roleId: this.selectedRole.id,
            userName: ds.userName,
            firstName: ds.firstName,
            lastName: ds.lastName
          }
        });
    });
  }

  getRoles() {
    this.sub$.sink = this.commonService.getRoles()
      .subscribe((roles: Role[]) => {
        this.roles = roles;
        if (this.roles.length > 0) {
          this.selectedRole = this.roles[0];
          this.selectedRoleId = this.roles[0].id;
          this.onRoleChange();
        }
      });
  }

  getUsers() {
    this.sub$.sink = this.commonService.getUsers().subscribe((users: User[]) => {
      this.allUsers = users;
      this.otherUsers = users.map(ds => {
        return {
          userId: ds.id,
          roleId: '',
          userName: ds.userName,
          firstName: ds.firstName,
          lastName: ds.lastName
        }
      });;
    });
  }
}
