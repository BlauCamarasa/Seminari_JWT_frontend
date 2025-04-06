import { HttpEvent, HttpHandlerFn, HttpRequest, HttpClient } from '@angular/common/http';
import { inject, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, catchError, throwError, switchMap } from 'rxjs';
import { AppComponent } from '../app.component';

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  
  console.log("Dentro del interceptador");

  const token = localStorage.getItem('access_token');
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const http = inject(HttpClient);

  const isRefreshRequest = req.url.includes('/auth/refresh'); 

  if (token && !isRefreshRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }


  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        console.warn('Access token expirado. Intentando refrescar...');

        // Eliminar access token viejo
        localStorage.removeItem('access_token');

        // Intentar refrescar token
        return http.post<{ access_token: string }>(
          'http://localhost:9000/api/auth/refresh',
          {},
          { withCredentials: true }
        ).pipe(
          switchMap(res => {
            const newToken = res.access_token;
            localStorage.setItem('access_token', newToken);

            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });

            return next(retryReq);
          }),
          catchError(refreshError => {
            toastr.error(
              'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
              'Sesión Expirada',
              {
                timeOut: 3000,
                closeButton: true
              }
            );

            router.navigate(['/inicio']);
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
}