import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../services/firestore.service';
import { DischargeTest, Series } from '../../models/pumping-data.model';

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
  seriesData: Series[] = [];
  loading = false;
  loadingSeries = false;
  error: string | null = null;
  activeTab: 'summary' | 'data' = 'summary';

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

  async selectTest(test: DischargeTest) {
    this.selectedTest = test;
    this.testSelected.emit(test);
    this.seriesData = [];
    this.activeTab = 'summary'; // Reset tab

    if (test.boreholeRef) {
      this.loadingSeries = true;
      try {
        this.seriesData = await this.firestoreService.getTestSeries(test.boreholeRef);
      } catch (err) {
        console.error('Failed to load series data', err);
      } finally {
        this.loadingSeries = false;
      }
    }
  }

  backToList() {
    this.selectedTest = null;
    this.seriesData = [];
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
