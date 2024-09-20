import { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../domains/auth/auth.service';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  let refresh = false;

  if (req.url.includes('/auth/access-token') || req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  const handleRequest = (accessToken: string) => {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (
          (error.status === 403 || error.status === 401 || error.status === 500) && !refresh) {
          refresh = true;

          return authService.refreshToken().pipe(
            switchMap((res: any) => {
              const newAccessToken = res.accessToken;
              document.cookie = `${res.refreshToken}; path=/`;

              const newAuthReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newAccessToken}`
                }
              });

              return next(newAuthReq);
            })
          );
        }

        return throwError(() => error);
      })
    );
  };

  return handleRequest('YOUR_AUTH_TOKEN_HERE');
};
