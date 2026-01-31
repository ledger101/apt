import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { Report } from '../../models/pumping-data.model';
import { DischargeReportsComponent } from './discharge-reports.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DischargeReportsComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  reports: Report[] = [];
  selectedReport: Report | null = null;
  loading = false;
  error: string | null = null;
  activeTab: string = 'list';
  reportType: 'progress' | 'discharge' = 'progress';

  @Output() backToDashboard = new EventEmitter<void>();

  constructor(private firestoreService: FirestoreService, private router: Router) {}

  async ngOnInit() {
    await this.loadReports();
  }
  
  setReportType(type: 'progress' | 'discharge') {
    this.reportType = type;
    this.selectedReport = null; // Clear selection when switching types
  }


  async loadReports() {
    this.loading = true;
    this.error = null;
    try {
      this.reports = await this.firestoreService.getReports();
      console.log(this.reports);
      
    } catch (error: any) {
      this.error = error.message || 'Failed to load reports';
      console.error('Error loading reports:', error);
    } finally {
      this.loading = false;
    }
  }

  selectReport(report: Report) {
    this.selectedReport = report;
    this.activeTab = 'dayShift'; // Default to day shift tab when viewing details
  }

  backToList() {
    this.selectedReport = null;
    this.activeTab = 'list';
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    // Handle string dates
    if (typeof date === 'string') {
      date = new Date(date);
    }
    // Now format the Date object
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return 'Invalid Date';
  }

  formatTime(date: any): string {
    if (!date) return 'N/A';
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    // Handle string dates
    if (typeof date === 'string') {
      date = new Date(date);
    }
    // Now format the Date object
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Invalid Time';
  }

  getTotalHours(shift: any): number {
    return shift.totalHours || 0;
  }

  getChargeableHours(shift: any): number {
    return shift.chargeableHours || 0;
  }

  navigateToDashboard(): void {
    this.backToDashboard.emit();
  }
}