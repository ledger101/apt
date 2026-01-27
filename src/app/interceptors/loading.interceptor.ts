import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const loadingService = inject(LoadingService);

    // Skip spinner for background requests if needed (e.g. headers.has('Skip-Loading'))
    if (req.headers.has('X-Skip-Loading')) {
        return next(req);
    }

    loadingService.show();

    return next(req).pipe(
        finalize(() => {
            loadingService.hide();
        })
    );
};
