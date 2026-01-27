import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="iconPath"></path>
      </svg>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
      <button *ngIf="actionLabel" (click)="onAction()" class="btn btn-primary">
        {{ actionLabel }}
      </button>
    </div>
  `,
    styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
    @Input() title = 'No items found';
    @Input() message = 'Get started by creating your first item';
    @Input() actionLabel?: string;
    @Input() icon: 'inbox' | 'document' | 'users' | 'folder' = 'inbox';
    @Output() action = new EventEmitter<void>();

    get iconPath(): string {
        const icons = {
            inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
            document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
            folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
        };
        return icons[this.icon];
    }

    onAction() {
        this.action.emit();
    }
}
