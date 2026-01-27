import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-requisitions',
  template: `
    <!-- Navigation Header -->
    <nav class="bg-[#F5E642] shadow-sm border-b border-yellow-500 fixed top-0 left-0 right-0 z-50">
      <div class="mx-auto px-6 lg:px-10">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-8">
            <!-- Logo -->
            <div class="flex-shrink-0">
              <img class="h-10 w-auto" src="/apt-logo-trimmed.svg" alt="APT">
            </div>
            
            <!-- Back to Financial Control -->
            <button
              (click)="goBack()"
              class="flex items-center text-gray-900 hover:text-gray-700 transition-colors duration-200 font-medium"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Financial Control
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="min-h-screen bg-gray-50 pt-20">
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-4">Requisitions</h1>
        <p>This is a placeholder for the Requisitions component.</p>
      </div>
    </div>
  `,
  styles: []
})
export class RequisitionsComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/finance']);
  }
}