import { Injectable, ErrorHandler } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    handleError(error: Error): void {
        // Log error to console in development
        console.error('Global error caught:', error);

        // In production, you would send this to a logging service
        // Example: this.loggingService.logError(error);

        // Show user-friendly error message
        this.showErrorNotification(error);
    }

    private showErrorNotification(error: Error): void {
        // You can integrate with a toast/notification service here
        const message = this.getUserFriendlyMessage(error);

        // For now, we'll just log it
        // In a real app, you'd show a toast notification
        console.warn('User-friendly error:', message);
    }

    private getUserFriendlyMessage(error: Error): string {
        // Map technical errors to user-friendly messages
        if (error.message.includes('network')) {
            return 'Network connection issue. Please check your internet connection.';
        }

        if (error.message.includes('permission')) {
            return 'You do not have permission to perform this action.';
        }

        if (error.message.includes('timeout')) {
            return 'The request took too long. Please try again.';
        }

        return 'An unexpected error occurred. Please try again or contact support.';
    }
}
