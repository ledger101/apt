import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../services/firestore.service';
import { DischargeTest } from '../../models/pumping-data.model';

@Component({
  selector: 'app-discharge-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discharge-reports.component.html',
//   styleUrls: ['./reports.component.scss'] // Re-use styles if possible or create new
})
export class DischargeReportsComponent implements OnInit {
  tests: DischargeTest[] = [];
  selectedTest: DischargeTest | null = null;
  loading = false;
  error: string | null = null;

  @Output() testSelected = new EventEmitter<DischargeTest>();

  constructor(private firestoreService: FirestoreService) {}

  async ngOnInit() {
    await this.loadTests();
  }

  async loadTests() {
    this.loading = true;
    this.error = null;
    try {
      this.tests = await this.firestoreService.getDischargeTests();
    } catch (error: any) {
      this.error = error.message || 'Failed to load discharge tests';
      console.error('Error loading discharge tests:', error);
    } finally {
      this.loading = false;
    }
  }

  selectTest(test: DischargeTest) {
    this.selectedTest = test;
    this.testSelected.emit(test);
    // You might want to show details here or emit event
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    if (date.toDate && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    if (typeof date === 'string') {
      date = new Date(date);
    }
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return 'Invalid Date';
  }
}
