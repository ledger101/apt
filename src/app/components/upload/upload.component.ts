import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
// import { DataUploadService, UploadProgress } from '../../services/data-upload.service';
import { ExcelParsingService } from '../../services/excel-parsing.service';
import { FirestoreService } from '../../services/firestore.service';
import { Report, ValidationResult, AquiferTest, DischargeTest, Borehole, Series, Quality } from '../../models';
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
  imports: [CommonModule, BaseChartDirective],
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
  ) {}

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
      // Try parsing as aquifer test first
      this.state.uploadProgress = { stage: 'parsing', message: 'Parsing file as discharge test...', percentage: 10 };
      
      let parseResult: { data: DischargeTest | null; borehole: Borehole | null; series: Series[]; quality: Quality[]; validation: ValidationResult };
      
      try {
        parseResult = await this.excelParsingService.parseAquiferFile(this.state.selectedFile);
      } catch (parseError: any) {
        console.error('Error during initial parse:', parseError);
        this.state.error = parseError.message || 'Failed to parse file';
        this.state.isUploading = false;
        this.state.uploadProgress = { stage: 'error', message: 'Parsing failed', percentage: 0 };
        return;
      }

      // If discharge parsing failed, try progress report
      if (!parseResult.validation.isValid) {
        this.state.uploadProgress = { stage: 'parsing', message: 'Trying as progress report...', percentage: 20 };
        const progressResult = await this.excelParsingService.parseExcelFile(this.state.selectedFile);
        parseResult = {
          data: progressResult.data as any,
          borehole: null,
          series: [],
          quality: [],
          validation: progressResult.validation
        };
      }

      this.state.uploadProgress = { stage: 'parsing', message: 'File parsed successfully', percentage: 40 };

      // Validate that we have data
      if (!parseResult || (!parseResult.data && !parseResult.validation)) {
        throw new Error('Parser returned invalid result');
      }

      // Extract data and validation
      this.state.validationResults = parseResult.validation;
      this.state.parsedData = parseResult.data;
      this.state.borehole = parseResult.borehole;
      this.state.series = parseResult.series || [];
      this.state.quality = parseResult.quality || [];
      this.state.uploadProgress = { stage: 'validating', message: 'Validation complete', percentage: 70 };

      console.log('Parsed data:', this.state.parsedData);
      console.log('Validation results:', this.state.validationResults);
      console.log('Series count:', this.state.series.length);

      // Set default active tab based on data type
      if (this.isReport(parseResult.data)) {
        this.state.activeTab = 'header';
        console.log('Data type: Report');
      } else if (this.isAquiferTest(parseResult.data)) {
        this.state.activeTab = 'testDetails';
        console.log('Data type: AquiferTest');
      } else if (this.isDischargeTest(parseResult.data)) {
        this.state.activeTab = 'testDetails';
        console.log('Data type: DischargeTest');
      } else {
        console.warn('Unknown data type:', parseResult.data);
        this.state.activeTab = 'header';
      }

      console.log('Active tab set to:', this.state.activeTab);

      // Create chart for test data
      try {
        if (this.isAquiferTest(parseResult.data)) {
          this.state.chartData = this.createChartData(parseResult.data as AquiferTest);
        } else if (this.isDischargeTest(parseResult.data) && this.state.series.length > 0) {
          console.log('Creating discharge chart with series:', this.state.series);
          this.state.chartData = this.createDischargeChart(this.state.series);
        }
        console.log('Chart created:', this.state.chartData);
      } catch (chartError: any) {
        console.error('Error creating chart:', chartError);
        // Don't fail the entire parse if chart creation fails
        this.state.chartData = null;
      }

      // Check if validation passed
      if (!parseResult.validation.isValid) {
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
      this.state.error = error.message || 'Failed to parse file. Please ensure the file matches the expected template for step or constant discharge tests.';
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
        // It's a DischargeTest
        const test = this.state.parsedData as DischargeTest;
        test.sourceFilePath = 'uploaded-file-path'; // TODO: set actual path
        if (this.state.borehole) {
          await this.firestoreService.saveBorehole(this.state.borehole);
        }
        await this.firestoreService.saveDischargeTest(test);
        await this.firestoreService.saveSeries(test.testId, this.state.series);
        await this.firestoreService.saveQuality(test.testId, this.state.quality);
        // TODO: save parse job
      }

      this.state.uploadProgress = { stage: 'complete', message: 'Data saved successfully!', percentage: 100 };
      this.state.success = true;
      this.state.isUploading = false;

      // Emit success event
      this.dataUploaded.emit(this.state.parsedData);

      // Reset after delay
      setTimeout(() => this.resetUpload(), 3000);

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

  // Create chart data for discharge test
  private createDischargeChart(series: Series[]): ChartConfiguration {
    if (series.length === 0) return this.createEmptyChart();

    // Use the first series for now
    const s = series[0];
    const labels = s.points.map(p => (p.t_min || 0).toString());
    const wlData = s.points.map(p => p.wl_m || 0);
    const ddData = s.points.map(p => p.ddn_m || 0);

    const datasets = [];
    if (wlData.some(v => v != null)) {
      datasets.push({
        label: 'Water Level (m)',
        data: wlData,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      });
    }
    if (ddData.some(v => v != null)) {
      datasets.push({
        label: 'Drawdown (m)',
        data: ddData,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      });
    }

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Discharge Test: ${s.seriesType}`
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
              text: 'Level (meters)'
            }
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
