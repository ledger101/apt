import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            // Retry failed requests up to 2 times
            retry(2),
            catchError((error: HttpErrorResponse) => {
                let errorMessage = '';

                if (error.error instanceof ErrorEvent) {
                    // Client-side error
                    errorMessage = `Client Error: ${error.error.message}`;
                } else {
                    // Server-side error
                    errorMessage = this.getServerErrorMessage(error);
                }

                console.error('HTTP Error:', errorMessage);
                return throwError(() => new Error(errorMessage));
            })
        );
    }

    private getServerErrorMessage(error: HttpErrorResponse): string {
        switch (error.status) {
            case 400:
                return 'Bad Request: Please check your input.';
            case 401:
                return 'Unauthorized: Please log in again.';
            case 403:
                return 'Forbidden: You do not have permission.';
            case 404:
                return 'Not Found: The requested resource was not found.';
            case 500:
                return 'Server Error: Please try again later.';
            case 503:
                return 'Service Unavailable: The server is temporarily unavailable.';
            default:
                return `Server Error: ${error.status} - ${error.message}`;
        }
    }
}
