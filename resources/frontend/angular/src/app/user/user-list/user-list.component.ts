import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { User } from '@core/domain-classes/user';
import { CommonError } from '@core/error-handler/common-error';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';
import { UserService } from '../user.service';
import { UserResource } from '@core/domain-classes/user-resource';
import { HttpResponse } from '@angular/common/http';
import { ResponseHeader } from '@core/domain-classes/document-header';
import { BehaviorSubject, Observable, of, merge, fromEvent } from 'rxjs';
import { CollectionViewer } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { Role } from '@core/domain-classes/role';

@Pipe({ name: 'rolesTransform' })
export class rolesTransformPipe implements PipeTransform {
  transform(userRoles: any): any {
    //console.log('rolesTransform===>',userRoles);
    var roles_name_array = [];
    if(userRoles){
      userRoles.forEach(childObj=> {
        //console.log('name==>',childObj.role.name);
        roles_name_array.push(childObj.role.name);
     });
     if(roles_name_array.length > 0){
      return roles_name_array.join(', ')
     }
    }
  }
}
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent extends BaseComponent implements OnInit {
  roles: Role[];
  users: User[] = [];
  displayedColumns: string[] = [
    'action',
    'email',
    'firstName',
    'lastName',
    'phoneNumber',
    'roles',
  ];
  isLoadingResults = false;
  userResource: UserResource;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input') input: ElementRef;
  @ViewChild('input1') input1: ElementRef;
  @ViewChild('metatag') metatag: ElementRef;

  createdDate = new FormControl('');
  //selection = new SelectionModel<DocumentInfo>(true, []);
  max = new Date();

  private usersSubject = new BehaviorSubject<User[]>([]);
  private responseHeaderSubject = new BehaviorSubject<ResponseHeader>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();
  public _count: number = 0;


  public get count(): number {
      return this._count;
  }

  public responseHeaderSubject$= this.responseHeaderSubject.asObservable();

  private _data: User[];
  public get data(): User[] {
    return this._data;
  }
  public set data(v: User[]) {
    this._data = v;
  }

  //constructor(private documentService: DocumentService) { }

  connect(collectionViewer: CollectionViewer): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.usersSubject.complete();
    this.loadingSubject.complete();
  }

  constructor(
    private userService: UserService,
    private toastrService: ToastrService,
    private commonService: CommonService,
    private commonDialogService: CommonDialogService,
    private dialog: MatDialog,
    private router: Router,
    private translationService: TranslationService
  ) {
    super();
    this.userResource = new UserResource();
    this.userResource.pageSize = 30;
    this.userResource.orderBy = 'createdDate desc';
  }

  ngOnInit(): void {
    this.getUsers(this.userResource);
    this.getResourceParameter();
    this.getRoles();
  }

  ngAfterViewInit() {
    //console.log(this.userResource)
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    this.sub$.sink = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap((c: any) => {
          //alert('1');
          this.userResource.skip =
            this.paginator.pageIndex * this.paginator.pageSize;
          this.userResource.pageSize = this.paginator.pageSize;
          this.userResource.orderBy =
            this.sort.active + ' ' + this.sort.direction;
          this.getUsers(this.userResource);
          //this.selection.clear();
        })
      )
      .subscribe();

    this.sub$.sink = fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.userResource.skip = 0;
          this.userResource.name = this.input.nativeElement.value;
          this.getUsers(this.userResource);
          //this.selection.clear();
        })
      )
      .subscribe();

      this.sub$.sink = fromEvent(this.input1.nativeElement, 'keyup')
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.userResource.skip = 0;
          this.userResource.userName = this.input1.nativeElement.value;
          this.getUsers(this.userResource);
          //this.selection.clear();
        })
      )
      .subscribe();

    // this.sub$.sink = fromEvent(this.metatag.nativeElement, 'keyup')
    //   .pipe(
    //     debounceTime(1000),
    //     distinctUntilChanged(),
    //     tap(() => {
    //       this.paginator.pageIndex = 0;
    //       this.documentResource.skip = 0;
    //       this.documentResource.metaTags = this.metatag.nativeElement.value;
    //       this.dataSource.loadDocuments(this.documentResource);
    //     })
    //   )
    //   .subscribe();
    this.sub$.sink = this.createdDate.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap((value: any) => {
          this.paginator.pageIndex = 0;
          this.userResource.skip = 0;
          if (value) {
            this.userResource.createDate = new Date(value).toISOString();
          } else {
            this.userResource.createDate = null;
          }
          this.userResource.skip = 0;
          this.getUsers(this.userResource);
        })
      )
      .subscribe();
  }

  deleteUser(user: User) {
    this.sub$.sink = this.commonDialogService
      .deleteConformationDialog(
        `${this.translationService.getValue(
          'ARE_YOU_SURE_YOU_WANT_TO_DELETE'
        )} ${user.userName}`
      )
      .subscribe((isTrue: boolean) => {
        if (isTrue) {
          this.sub$.sink = this.userService
            .deleteUser(user.id)
            .subscribe(() => {
              this.toastrService.success(
                this.translationService.getValue('USER_DELETED_SUCCESSFULLY')
              );
              this.getUsers(this.userResource);
            });
        }
      });
  }

  getUsers(userResource): void {
    this.isLoadingResults = true;
    this.loadingSubject.next(true);
    this.sub$.sink = this.commonService.getUsersList(userResource).subscribe(
      (resp: HttpResponse<User[]>) => {
        const paginationParam= new ResponseHeader();
        //console.log('paginationParam',paginationParam);
        paginationParam.pageSize= parseInt( resp.headers.get('pageSize'));
        paginationParam.totalCount= parseInt( resp.headers.get('totalCount'));
        paginationParam.skip= parseInt( resp.headers.get('skip'));
        this.responseHeaderSubject.next({...paginationParam});

        this.users = [...resp.body];
        //console.log('this.users',this.users);
        this._count = this.users.length;
        this.usersSubject.next(this.users);
        this.isLoadingResults = false;
      },
      (err: CommonError) => {
        err.messages.forEach((msg) => {
          this.toastrService.error(msg);
          this.isLoadingResults = false;
        });
      }
    );
  }

  resetPassword(user: User): void {
    this.dialog.open(ResetPasswordComponent, {
      width: '350px',
      data: Object.assign({}, user),
    });
  }

  editUser(userId: string) {
    this.router.navigate(['/users/manage', userId]);
  }
  userPermission(userId: string) {
    this.router.navigate(['/users/permission', userId]);
  }
  getResourceParameter() {
    this.sub$.sink = this.responseHeaderSubject$.subscribe(
      (c: ResponseHeader) => {
        if (c) {
          this.userResource.pageSize = c.pageSize;
          this.userResource.skip = c.skip;
          this.userResource.totalCount = c.totalCount;
        }
      }
    );
  }
  getRoles() {
    this.sub$.sink = this.commonService.getRoles()
      .subscribe((roles: Role[]) => {
        this.roles = roles;
        // if (this.roles.length > 0) {
        //   this.selectedRole = this.roles[0];
        //   this.selectedRoleId = this.roles[0].id;
        //   this.onRoleChange();
        // }
      });
  }
  onRoleChange(filtervalue: any) {
    if (filtervalue.value) {
      this.userResource.role = filtervalue.value;
    } else {
      this.userResource.role = '';
    }
    this.userResource.skip = 0;
    this.getUsers(this.userResource);
  }
}
