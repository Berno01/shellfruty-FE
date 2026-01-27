import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { catchError, throwError } from "rxjs";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejo de errores globales
      if (error.status === 401) {
        console.error("Unauthorized request");
        // Redirigir al login o limpiar sesión
      } else if (error.status === 500) {
        console.error("Internal Server Error");
      } else {
        console.error("Ocurrió un error:", error.message);
      }
      return throwError(() => error);
    }),
  );
};
