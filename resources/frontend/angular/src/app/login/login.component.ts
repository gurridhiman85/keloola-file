import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { BaseComponent } from '../base.component';
import { Router } from '@angular/router';
import { UserAuth } from '@core/domain-classes/user-auth';
import { SecurityService } from '@core/security/security.service';
import { ToastrService } from 'ngx-toastr';
import { CommonError } from '@core/error-handler/common-error';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent extends BaseComponent implements OnInit {
  loginFormGroup: UntypedFormGroup;
  isLoading = false;
  lat: number;
  lng: number;
  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private securityService: SecurityService,
    private toastr: ToastrService
  ) {
    super();
  }

  ngOnInit(): void {
    this.createFormGroup();
    navigator.geolocation.getCurrentPosition((position) => {
      this.lat = position.coords.latitude;
      this.lng = position.coords.longitude;
    });
  }

  onLoginSubmit() {
    if (this.loginFormGroup.valid) {
      this.isLoading = true;
      const userObject = {
        email: this.loginFormGroup.get('userName').value,
        password: this.loginFormGroup.get('password').value,
      };
      this.sub$.sink = this.securityService.login(userObject).subscribe(
        (c: UserAuth) => {
          this.isLoading = false;
          this.toastr.success('User login successfully.');
          if (this.securityService.hasClaim('dashboard_view_dashboard')) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        },
        (err: CommonError) => {
          this.isLoading = false;
          this.toastr.error(err.error['message']);
        }
      );
    }
    else{
      this.loginFormGroup.markAllAsTouched();
    }
  }

  createFormGroup(): void {
    this.loginFormGroup = this.fb.group({
      userName: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }
}
