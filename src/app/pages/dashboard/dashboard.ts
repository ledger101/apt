import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UploadComponent } from '../../components/upload/upload.component';
import { ReportsComponent } from '../../components/reports/reports.component';
// import { DataGridComponent } from '../../components/data-grid/data-grid.component';
// Updated for pumping data models
import { Report, AquiferTest, DischargeTest } from '../../models/pumping-data.model';

interface DashboardTile {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  badge?: string;
}

interface DashboardMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}

interface ActivityItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description: string;
  timestamp: Date;
  module: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports: [
    CommonModule,
    UploadComponent,
    ReportsComponent,
    // DataGridComponent, // TODO: Re-enable after updating for pumping models
  ],
  standalone: true,
})
export class DashboardComponent {
  currentView = 'dashboard'; // Default view
  selectedReport: Report | AquiferTest | DischargeTest | null = null;
  dataGridMode: 'view' | 'edit' = 'view';
  uploadedData: Report | AquiferTest | DischargeTest | null = null;

  tiles: DashboardTile[] = [
    {
      id: 'personnel',
      title: 'Personnel Management',
      description: 'Employee onboarding, leave tracking, and certifications',
      icon: 'users',
      color: 'blue',
      route: '/personnel'
    },
    {
      id: 'fleet',
      title: 'Fleet & Equipment',
      description: 'Vehicle and rig registration, maintenance alerts',
      icon: 'truck',
      color: 'purple',
      route: '/fleet'
    },
    {
      id: 'finance',
      title: 'Financial Control',
      description: 'Progress invoicing and expense management',
      icon: 'dollar-sign',
      color: 'yellow',
      route: '/finance'
    },
    {
      id: 'operations',
      title: 'Rig Operations',
      description: 'Technical reports, OHS forms, and aquifer tests',
      icon: 'cog',
      color: 'red',
      route: '/operations'
    },
    {
      id: 'ohs',
      title: 'OHS Management',
      description: 'Safety observations, inspections, and compliance tracking',
      icon: 'shield',
      color: 'green',
      route: '/ohs'
    },
    {
      id: 'reports',
      title: 'Progress Reports',
      description: 'View and manage pumping progress reports',
      icon: 'package',
      color: 'yellow',
      route: '/reports'
    }
  ];

  metrics: DashboardMetric[] = [
    {
      label: 'Active Vehicles',
      value: 12,
      change: '+2 this month',
      trend: 'up',
      icon: 'truck'
    },
    {
      label: 'Pending Leave',
      value: 5,
      change: '3 awaiting approval',
      trend: 'neutral',
      icon: 'users'
    },
    {
      label: 'Open Requisitions',
      value: 8,
      change: '2 urgent',
      trend: 'up',
      icon: 'package'
    },
    {
      label: 'Safety Incidents',
      value: 0,
      change: 'Last 30 days',
      trend: 'down',
      icon: 'shield'
    }
  ];

  recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'success',
      title: 'Vehicle Registered',
      description: 'Toyota Hilux (ABC-123) added to fleet',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      module: 'Fleet'
    },
    {
      id: '2',
      type: 'info',
      title: 'Leave Request Submitted',
      description: 'John Doe requested annual leave (5 days)',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      module: 'Personnel'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Maintenance Due',
      description: 'Rig-001 service interval approaching',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      module: 'Fleet'
    },
    {
      id: '4',
      type: 'success',
      title: 'Safety Inspection Completed',
      description: 'Site A passed monthly OHS inspection',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      module: 'OHS'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  setView(view: string) {
    this.currentView = view;
  }

  navigateToModule(route: string) {
    console.log('navigateToModule called with route:', route);
    if (route === '/reports') {
      this.navigateToReports();
    } else {
      console.log('Navigating to:', route);
      this.router.navigate([route]);
    }
  }

  onDataUploaded(data: Report | AquiferTest | DischargeTest) {
    this.uploadedData = data;
    this.selectedReport = data;
    this.dataGridMode = 'view';
    this.setView('dataGrid');
    console.log('Data uploaded successfully:', data);
  }

  navigateToUpload() {
    this.setView('upload');
  }

  navigateToReports() {
    this.setView('reports');
  }

  getIconPath(icon: string): string {
    const iconMap: { [key: string]: string } = {
      'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      'package': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      'truck': 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 104 0',
      'dollar-sign': 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
      'cog': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'shield': 'M12 2l8 3v7c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l8-3z'
    };
    return iconMap[icon] || '';
  }

  getMetricColor(trend?: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up': return 'green';
      case 'down': return 'blue';
      case 'neutral': return 'yellow';
      default: return 'blue';
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }
}
