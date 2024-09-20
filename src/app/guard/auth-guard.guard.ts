import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthService} from "../domains/auth/auth.service";
import {map, Observable} from "rxjs";

export const authGuardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const isAuthorized = (route: ActivatedRouteSnapshot): Observable<boolean> => {
    return authService.validateToken();
  };

  return isAuthorized(route).pipe(
    map((isAuthorized: boolean) => {
      if (!isAuthorized) {
        return router.createUrlTree(['/sign-in']);
      }
      return isAuthorized;
    })
  );

};
