import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';


import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
// import { DataUploadService, UploadProgress } from '../../services/data-upload.service';
import { ExcelParsingService } from '../../services/excel-parsing.service';
import { FirestoreService } from '../../services/firestore.service';
import { Report, ValidationResult, AquiferTest, DischargeTest, Site, Borehole, Series, Quality } from '../../models';
import { BaseChartDirective } from 'ng2-charts';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface UploadState {
  isDragging: boolean;
  selectedFile: File | null;
  isUploading: boolean;
  uploadProgress: { stage: string; message: string; percentage: number };
  validationResults: ValidationResult | null;
  parsedData: Report | AquiferTest | DischargeTest | null;
  detectedType: 'progress_report' | 'stepped_discharge' | 'constant_discharge' | 'unknown';
  site: Site | null;
  borehole: Borehole | null;
  series: Series[];
  quality: Quality[];
  showPreview: boolean;
  error: string | null;
  success: boolean;
  activeTab: string;
  chartData: ChartConfiguration | null;
}


@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnDestroy {
  @Output() dataUploaded = new EventEmitter<Report | AquiferTest | DischargeTest>();

  private destroy$ = new Subject<void>();

  state: UploadState = {
    isDragging: false,
    selectedFile: null,
    isUploading: false,
    uploadProgress: { stage: 'parsing', message: 'Ready to upload', percentage: 0 },
    validationResults: null,
    parsedData: null,
    detectedType: 'unknown',
    site: null,
    borehole: null,
    series: [],
    quality: [],
    showPreview: false,
    error: null,
    success: false,
    activeTab: 'header',
    chartData: null
  };

  // Allowed file types
  readonly ALLOWED_EXTENSIONS = ['.xlsx', '.csv'];
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(
    // private dataUploadService: DataUploadService,
    private excelParsingService: ExcelParsingService,
    private firestoreService: FirestoreService,
    private router: Router
  ) { }

  // ngOnInit(): void {
  //   // Subscribe to upload progress
  //   this.dataUploadService.progress$
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe(progress => {
  //       this.state.uploadProgress = progress;

  //       // Handle completion
  //       if (progress.stage === 'complete') {
  //         this.state.success = true;
  //         this.state.isUploading = false;
  //         setTimeout(() => this.resetUpload(), 3000);
  //       }

  //       // Handle errors
  //       if (progress.stage === 'error') {
  //         this.state.error = progress.message;
  //         this.state.isUploading = false;
  //       }
  //     });
  // }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Type guard to check if parsed data is a Report
  isReport(data: Report | AquiferTest | DischargeTest | null): data is Report {
    return data !== null && 'reportDate' in data;
  }

  // Type guard to check if parsed data is an AquiferTest
  isAquiferTest(data: Report | AquiferTest | DischargeTest | null): data is AquiferTest {
    return data !== null && 'testId' in data && 'dataPoints' in data;
  }

  // Type guard to check if parsed data is a DischargeTest
  isDischargeTest(data: Report | AquiferTest | DischargeTest | null): data is DischargeTest {
    return data !== null && 'testId' in data && 'boreholeRef' in data;
  }

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  // File input change handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  // Handle file selection (from input or drop)
  private handleFileSelection(file: File): void {
    // Reset previous state
    this.state.error = null;
    this.state.success = false;
    this.state.validationResults = null;
    this.state.parsedData = null;
    this.state.showPreview = false;

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      this.state.error = validation.error || 'Invalid file';
      this.state.selectedFile = null;
      return;
    }

    this.state.selectedFile = file;
  }

  // Validate file type and size
  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Invalid file type. Please upload an Excel file (${this.ALLOWED_EXTENSIONS.join(', ')})`
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      };
    }

    return { isValid: true };
  }

  // Parse and validate the selected file
  async parseFile(): Promise<void> {
    if (!this.state.selectedFile) {
      this.state.error = 'No file selected';
      return;
    }

    this.state.isUploading = true;
    this.state.error = null;

    try {
      this.state.uploadProgress = { stage: 'parsing', message: 'Detecting template and parsing...', percentage: 20 };

      const result = await this.excelParsingService.parseFile(this.state.selectedFile);

      this.state.uploadProgress = { stage: 'parsing', message: 'File parsed successfully', percentage: 60 };

      // Extract data and validation
      this.state.validationResults = result.validation;
      this.state.parsedData = result.data;
      this.state.detectedType = result.type;
      this.state.site = result.site;
      this.state.borehole = result.borehole;
      this.state.series = result.series || [];
      this.state.quality = result.quality || [];
      this.state.uploadProgress = { stage: 'validating', message: 'Validation complete', percentage: 80 };

      console.log('Detected type:', result.type);
      console.log('Parsed data:', this.state.parsedData);

      // Set default active tab based on data type
      if (result.type === 'progress_report') {
        this.state.activeTab = 'header';
      } else {
        this.state.activeTab = 'testDetails';
      }

      // Create chart for test data if applicable
      try {
        if (this.isAquiferTest(this.state.parsedData)) {
          this.state.chartData = this.createChartData(this.state.parsedData as AquiferTest);
        } else if (this.isDischargeTest(this.state.parsedData) && this.state.series.length > 0) {
          this.state.chartData = this.createDischargeChart(this.state.series);
        }
      } catch (chartError: any) {
        console.error('Error creating chart:', chartError);
        this.state.chartData = null;
      }

      // Check if validation passed (allow preview even with warnings, but not with errors)
      if (!result.validation.isValid) {
        this.state.error = 'Validation failed. Please review the errors below.';
        this.state.isUploading = false;
        this.state.showPreview = true;
        return;
      }

      // Show preview for confirmation
      this.state.showPreview = true;
      this.state.isUploading = false;
      this.state.uploadProgress = { stage: 'validating', message: 'Ready to save', percentage: 100 };

    } catch (error: any) {
      console.error('Error parsing file:', error);
      this.state.error = error.message || 'Failed to parse file. Please ensure the file matches a supported template.';
      this.state.isUploading = false;
      this.state.uploadProgress = { stage: 'error', message: 'Parsing failed', percentage: 0 };
    }
  }


  // Confirm and save to Firestore
  async confirmUpload(): Promise<void> {
    if (!this.state.parsedData || !this.state.validationResults?.isValid) {
      this.state.error = 'Cannot save invalid data';
      return;
    }

    this.state.isUploading = true;
    this.state.error = null;

    try {
      this.state.uploadProgress = { stage: 'saving', message: 'Saving to Firestore...', percentage: 80 };

      // Save data based on type
      if (this.isReport(this.state.parsedData)) {
        // It's a Report
        await this.firestoreService.saveReport(this.state.parsedData as Report);
      } else if (this.isAquiferTest(this.state.parsedData)) {
        // It's an AquiferTest
        await this.firestoreService.saveAquiferTest(this.state.parsedData as AquiferTest);
      } else if (this.isDischargeTest(this.state.parsedData)) {
        // It's a DischargeTest - save with site-based structure
        const test = this.state.parsedData as DischargeTest;
        const sourcePath = `uploads/${this.state.selectedFile?.name || 'unknown'}`;
        test.sourceFilePath = sourcePath;

        // Save site first
        if (this.state.site) {
          await this.firestoreService.saveSite(this.state.site);
        }

        // Save borehole under site
        if (this.state.site && this.state.borehole) {
          await this.firestoreService.saveBorehole(this.state.site.siteId, this.state.borehole);
        }

        // Save test under borehole
        if (this.state.site && this.state.borehole) {
          await this.firestoreService.saveDischargeTest(
            this.state.site.siteId,
            this.state.borehole.boreholeId,
            test
          );

          // Save series under test
          await this.firestoreService.saveSeries(
            this.state.site.siteId,
            this.state.borehole.boreholeId,
            test.testId,
            this.state.series
          );

          // Save quality under test
          await this.firestoreService.saveQuality(
            this.state.site.siteId,
            this.state.borehole.boreholeId,
            test.testId,
            this.state.quality
          );

          // Save parse job with nested path reference
          const totalPoints = this.state.series.reduce((sum, s) => sum + s.points.length, 0);
          await this.firestoreService.saveParseJob({
            jobId: `job-${Date.now()}`,
            testRef: `sites/${this.state.site.siteId}/boreholes/${this.state.borehole.boreholeId}/tests/${test.testId}`,
            status: 'parsed',
            warnings: this.state.validationResults?.warnings || [],
            counts: {
              series: this.state.series.length,
              points: totalPoints
            },
            sourceFilePath: sourcePath,
            createdBy: 'user-id', // TODO: Get from Auth
            createdAt: Timestamp.now()
          });
        }
      }


      this.state.uploadProgress = { stage: 'complete', message: 'Data saved successfully!', percentage: 100 };
      this.state.success = true;
      this.state.isUploading = false;

      // Emit success event
      this.dataUploaded.emit(this.state.parsedData);

      // Notify user via Swal
      Swal.fire({
        title: 'Success!',
        text: 'Data has been successfully uploaded and saved.',
        icon: 'success',
        confirmButtonColor: '#3B82F6',
        timer: 3000,
        timerProgressBar: true
      }).then(() => {
        this.resetUpload();
      });

    } catch (error: any) {
      console.error('Error saving to Firestore:', error);
      this.state.error = error.message || 'Failed to save data';
      this.state.isUploading = false;
      this.state.uploadProgress = { stage: 'error', message: 'Save failed', percentage: 0 };
    }
  }

  // Set active preview tab
  setActiveTab(tab: string): void {
    this.state.activeTab = tab;
  }

  // Cancel preview and go back to file selection
  cancelUpload(): void {
    this.state.showPreview = false;
    this.state.parsedData = null;
    this.state.validationResults = null;
    this.state.error = null;
  }

  // Reset entire upload state
  resetUpload(): void {
    this.state = {
      isDragging: false,
      selectedFile: null,
      isUploading: false,
      uploadProgress: { stage: 'parsing', message: 'Ready to upload', percentage: 0 },
      validationResults: null,
      parsedData: null,
      detectedType: 'unknown',
      site: null,
      borehole: null,
      series: [],
      quality: [],
      showPreview: false,
      error: null,
      success: false,
      activeTab: 'header',
      chartData: null
    };
  }

  // Get file size in human-readable format
  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Get progress bar color based on stage
  getProgressColor(): string {
    switch (this.state.uploadProgress.stage) {
      case 'complete': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  }

  // Get validation summary
  getValidationSummary(): string {
    if (!this.state.validationResults) return '';

    const { errors, warnings } = this.state.validationResults;
    const parts: string[] = [];

    if (errors.length > 0) {
      parts.push(`${errors.length} error${errors.length !== 1 ? 's' : ''}`);
    }
    if (warnings.length > 0) {
      parts.push(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No issues found';
  }

  // Get friendly name for series type
  getSeriesTypeName(seriesType: string): string {
    const names: { [key: string]: string } = {
      'discharge': 'Discharge Borehole',
      'discharge_recovery': 'Discharge Borehole Recovery',
      'discharge_rate': 'Discharge Rate',
      'obshole1': 'Observation Hole 1',
      'obshole1_recovery': 'Observation Hole 1 Recovery',
      'obshole2': 'Observation Hole 2',
      'obshole2_recovery': 'Observation Hole 2 Recovery',
      'obshole3': 'Observation Hole 3',
      'obshole3_recovery': 'Observation Hole 3 Recovery',
      'obs_hole_1': 'Observation Hole 1',
      'obs_hole_2': 'Observation Hole 2',
      'obs_hole_3': 'Observation Hole 3',
      'recovery': 'Recovery'
    };
    return names[seriesType] || seriesType;
  }

  // Create chart data for aquifer test
  private createChartData(test: AquiferTest): ChartConfiguration {
    const labels = test.dataPoints.map(p => p.time.toString());
    const data = test.dataPoints.map(p => p.waterLevel);

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Drawdown Curve (Water Level)',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Aquifer Test Drawdown Curve'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time (minutes)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Water Level (meters)'
            }
          }
        }
      }
    };
  }

  // Create chart data for discharge test - shows all series
  private createDischargeChart(series: Series[]): ChartConfiguration {
    if (series.length === 0) return this.createEmptyChart();

    // Color palette for different series
    const colors = [
      'rgb(75, 192, 192)',   // teal
      'rgb(255, 99, 132)',   // red
      'rgb(54, 162, 235)',   // blue
      'rgb(255, 206, 86)',   // yellow
      'rgb(153, 102, 255)',  // purple
      'rgb(255, 159, 64)',   // orange
      'rgb(199, 199, 199)',  // grey
      'rgb(83, 102, 255)',   // indigo
    ];

    // Get series type labels
    const seriesLabels: { [key: string]: string } = {
      'discharge': 'Discharge Borehole',
      'discharge_recovery': 'Discharge Recovery',
      'obshole1': 'Observation Hole 1',
      'obshole1_recovery': 'Obs Hole 1 Recovery',
      'obshole2': 'Observation Hole 2',
      'obshole2_recovery': 'Obs Hole 2 Recovery',
      'obshole3': 'Observation Hole 3',
      'obshole3_recovery': 'Obs Hole 3 Recovery',
      'recovery': 'Recovery',
      'discharge_rate': 'Discharge Rate'
    };

    const datasets: any[] = [];
    let colorIndex = 0;

    // Create datasets for each series
    for (const s of series) {
      const label = seriesLabels[s.seriesType] || s.seriesType;
      const color = colors[colorIndex % colors.length];
      
      // Only add if there's data
      if (s.points.length > 0) {
        // Water Level dataset
        const wlData = s.points.map(p => ({ x: p.t_min || 0, y: p.wl_m }));
        if (wlData.some(p => p.y != null)) {
          datasets.push({
            label: `${label} - WL (m)`,
            data: wlData.filter(p => p.y != null),
            borderColor: color,
            backgroundColor: color,
            tension: 0.1,
            pointRadius: 2
          });
        }

        // Drawdown dataset (different shade)
        const ddData = s.points.map(p => ({ x: p.t_min || 0, y: p.ddn_m }));
        if (ddData.some(p => p.y != null)) {
          datasets.push({
            label: `${label} - Drawdown (m)`,
            data: ddData.filter(p => p.y != null),
            borderColor: color.replace('rgb', 'rgba').replace(')', ', 0.5)'),
            backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.5)'),
            borderDash: [5, 5],
            tension: 0.1,
            pointRadius: 2
          });
        }
      }
      colorIndex++;
    }

    return {
      type: 'scatter',
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Constant Discharge Test - All Series'
          },
          legend: {
            display: true,
            position: 'bottom'
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Time (minutes)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Level (meters)'
            },
            reverse: false
          }
        }
      }
    };
  }

  private createEmptyChart(): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'No data to display'
          }
        }
      }
    };
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
