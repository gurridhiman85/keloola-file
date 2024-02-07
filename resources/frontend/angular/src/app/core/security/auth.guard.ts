import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateChild,
  CanLoad,
  Route
} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { SecurityService } from './security.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private securityService: SecurityService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.securityService.isUserAuthenticate()) {
      const claimType: string = next.data["claimType"];
      if (claimType) {
        if (!this.securityService.hasClaim(claimType)) {
          this.toastr.error(`You don't have right to access this page`);
          this.router.navigate(['/my-profile']);
          return false;
        }
      }
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }

  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Get property name on security object to check
    // let claimType: string = next.data['claimType'];
    if (this.securityService.isUserAuthenticate()) {
      let claimType: string = next.data["claimType"];
      if (claimType) {
        if (!this.securityService.hasClaim(claimType)) {
          this.toastr.error(`You don't have right to access this page `);
          return false;
        }
      }
      return true;
    } else {
      this.router.navigate(['login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
  }
  canLoad(route: Route): boolean {
    if (this.securityService.isUserAuthenticate()) {
      return true;
    } else {
      this.router.navigate(['login']);
      return false;
    }
  }
}
