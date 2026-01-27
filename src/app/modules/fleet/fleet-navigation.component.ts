import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

interface FleetNavItem {
  label: string;
  route: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-fleet-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
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
      <!-- Navigation Cards -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Fleet & Equipment Management</h2>
          <p class="text-gray-600">Manage your vehicles, rigs, maintenance schedules, and logistics operations</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            *ngFor="let item of navItems"
            routerLinkActive="ring-2 ring-blue-500 ring-offset-2"
            class="group relative bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
            [routerLink]="item.route"
          >
            <div class="flex items-center mb-4">
              <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" [attr.stroke-width]="'2'">
                  <path *ngIf="item.icon === 'truck'" stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 104 0"></path>
                  <path *ngIf="item.icon === 'wrench'" stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path *ngIf="item.icon === 'map'" stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900 group-hover:text-gray-700">{{ item.label }}</h3>
              </div>
            </div>
            <p class="text-sm text-gray-600 mb-4">{{ item.description }}</p>
            <div class="flex items-center text-sm text-blue-600 group-hover:text-blue-700">
              <span>Access {{ item.label.toLowerCase() }}</span>
              <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class FleetNavigationComponent {
  navItems: FleetNavItem[] = [
    {
      label: 'Asset Register',
      route: '/fleet/register',
      icon: 'truck',
      description: 'Register and manage vehicles and rigs in your fleet'
    },
    {
      label: 'Maintenance Alerts',
      route: '/fleet/maintenance',
      icon: 'wrench',
      description: 'Track maintenance schedules and overdue services'
    },
    {
      label: 'Logistics',
      route: '/fleet/logistics',
      icon: 'map',
      description: 'Monitor asset locations and operational status'
    },
    {
      label: 'Pre-Start Check',
      route: '/fleet/pre-start-check',
      icon: 'truck', // or another icon
      description: 'Complete pre-start checklist for light vehicles'
    }
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}