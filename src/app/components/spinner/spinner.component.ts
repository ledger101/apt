import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
    selector: 'app-spinner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="spinner-overlay" *ngIf="loadingService.loading$ | async">
      <div class="spinner"></div>
    </div>
  `,
    styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent {
    constructor(public loadingService: LoadingService) { }
}
