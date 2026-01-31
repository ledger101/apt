import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [RouterModule],
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
            
            <!-- Back to Dashboard -->
            <button
              (click)="goBack()"
              class="flex items-center text-gray-900 hover:text-gray-700 transition-colors duration-200 font-medium"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="min-h-screen bg-gray-50 pt-20">
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-4">Financial Control</h1>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a routerLink="requisitions" class="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border">
            <h2 class="text-lg font-semibold">Requisitions</h2>
            <p>Manage purchase requisitions</p>
          </a>
          <a routerLink="invoices" class="block p-4 bg-green-50 hover:bg-green-100 rounded-lg border">
            <h2 class="text-lg font-semibold">Invoices</h2>
            <p>Handle invoicing</p>
          </a>
          <a routerLink="income-expense" class="block p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border">
            <h2 class="text-lg font-semibold">Income & Expense</h2>
            <p>Track income and expenses</p>
          </a>
          <a routerLink="invoice-config" class="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border">
            <h2 class="text-lg font-semibold">Invoice Settings</h2>
            <p>Configure invoice rates and settings</p>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class FinancialComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}