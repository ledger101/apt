import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { FirestoreService } from '../../services/firestore.service';
import { DischargeTest, Series } from '../../models/pumping-data.model';

@Component({
  selector: 'app-discharge-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './discharge-reports.component.html',
//   styleUrls: ['./reports.component.scss'] // Re-use styles if possible or create new
})
export class DischargeReportsComponent implements OnInit {
  tests: DischargeTest[] = [];
  selectedTest: DischargeTest | null = null;
  seriesData: Series[] = [];
  chartConfigs: { title: string; config: ChartConfiguration }[] = [];
  loading = false;
  loadingSeries = false;
  error: string | null = null;
  activeTab: 'summary' | 'data' | 'charts' = 'summary';

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
    this.chartConfigs = [];
    this.activeTab = 'summary'; // Reset tab

    if (test.boreholeRef) {
      this.loadingSeries = true;
      try {
        this.seriesData = await this.firestoreService.getTestSeries(test.boreholeRef);
        this.chartConfigs = this.buildCharts(this.seriesData);
      } catch (err) {
        console.error('Failed to load series data', err);
      } finally {
        this.loadingSeries = false;
      }
    }
  }

  private buildCharts(series: Series[]): { title: string; config: ChartConfiguration }[] {
    const seriesLabels: { [key: string]: string } = {
      'discharge': 'Discharge Borehole',
      'discharge_recovery': 'Discharge Borehole Recovery',
      'obshole1': 'Observation Hole 1',
      'obshole1_recovery': 'Obs Hole 1 Recovery',
      'obshole2': 'Observation Hole 2',
      'obshole2_recovery': 'Obs Hole 2 Recovery',
      'obshole3': 'Observation Hole 3',
      'obshole3_recovery': 'Obs Hole 3 Recovery',
      'recovery': 'Recovery',
      'discharge_rate': 'Discharge Rate'
    };

    const colors = [
      'rgb(37, 99, 235)',    // blue-600
      'rgb(220, 38, 38)',    // red-600
      'rgb(5, 150, 105)',    // emerald-600
      'rgb(217, 119, 6)',    // amber-600
      'rgb(124, 58, 237)',   // violet-600
      'rgb(236, 72, 153)',   // pink-500
    ];

    const configs: { title: string; config: ChartConfiguration }[] = [];
    let colorIdx = 0;

    for (const s of series) {
      const pts = s.points.filter(p => p.t_min != null && p.wl_m != null);
      if (pts.length === 0) { colorIdx++; continue; }

      const label = seriesLabels[s.seriesType] || s.seriesType.replace(/_/g, ' ');
      const stepSuffix = s.rateIndex != null ? ` – Step ${s.rateIndex}` : '';
      const color = colors[colorIdx % colors.length];

      const datasets: any[] = [{
        label: 'Water Level (m)',
        data: pts.map(p => ({ x: p.t_min!, y: p.wl_m! })),
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.15)'),
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.1,
        fill: false
      }];

      // Add drawdown as a dashed series if present
      const ddPts = s.points.filter(p => p.t_min != null && p.ddn_m != null);
      if (ddPts.length > 0) {
        datasets.push({
          label: 'Drawdown (m)',
          data: ddPts.map(p => ({ x: p.t_min!, y: p.ddn_m! })),
          borderColor: color.replace('rgb', 'rgba').replace(')', ', 0.55)'),
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 2,
          tension: 0.1,
          fill: false
        });
      }

      configs.push({
        title: label + stepSuffix,
        config: {
          type: 'scatter',
          data: { datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: false },
              legend: { display: true, position: 'bottom', labels: { boxWidth: 14, font: { size: 12 } } }
            },
            scales: {
              x: {
                type: 'linear',
                title: { display: true, text: 'Time (min)', font: { size: 12 } },
                ticks: { maxTicksLimit: 12 }
              },
              y: {
                title: { display: true, text: 'Water Level (m)', font: { size: 12 } },
                reverse: false
              }
            }
          }
        }
      });
      colorIdx++;
    }

    return configs;
  }

  backToList() {
    this.selectedTest = null;
    this.seriesData = [];
    this.chartConfigs = [];
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
