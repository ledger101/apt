import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

@Component({
    selector: 'app-alert',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="alert" [ngClass]="'alert-' + type" *ngIf="message">
      <div class="alert-icon">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path *ngIf="type === 'info'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          <path *ngIf="type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          <path *ngIf="type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          <path *ngIf="type === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div class="alert-content">
        <div class="alert-title" *ngIf="title">{{ title }}</div>
        <div class="alert-message">{{ message }}</div>
      </div>
      <button *ngIf="dismissible" (click)="onDismiss()" class="alert-dismiss">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `,
    styleUrls: ['./alert.component.scss']
})
export class AlertComponent {
    @Input() type: AlertType = 'info';
    @Input() title?: string;
    @Input() message?: string;
    @Input() dismissible = false;

    onDismiss() {
        this.message = undefined;
    }
}
