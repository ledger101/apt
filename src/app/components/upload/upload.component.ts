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
import { InvoiceService } from '../../services/invoice.service';
import { InvoiceConfigService } from '../../services/invoice-config.service';
import { Report, ValidationResult, AquiferTest, DischargeTest, Site, Borehole, Series, Quality } from '../../models';
import { BaseChartDirective } from 'ng2-charts';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface FileUploadItem {
  file: File;
  status: 'pending' | 'parsing' | 'validating' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  parsedData?: Report | AquiferTest | DischargeTest | null;
  validationResults?: ValidationResult;
  detectedType?: 'progress_report' | 'stepped_discharge' | 'constant_discharge' | 'unknown';
  site?: Site | null;
  borehole?: Borehole | null;
  series?: Series[];
  quality?: Quality[];
}

interface UploadState {
  isDragging: boolean;
  selectedFiles: FileUploadItem[];
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
  currentFileIndex: number;
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
    selectedFiles: [],
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
    chartData: null,
    currentFileIndex: -1
  };

  // Allowed file types
  readonly ALLOWED_EXTENSIONS = ['.xlsx', '.csv'];
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(
    // private dataUploadService: DataUploadService,
    private excelParsingService: ExcelParsingService,
    private firestoreService: FirestoreService,
    private invoiceService: InvoiceService,
    private invoiceConfigService: InvoiceConfigService,
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
      this.handleFileSelection(Array.from(files));
    }
  }

  // File input change handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(Array.from(input.files));
    }
  }

  // Handle file selection (from input or drop)
  private handleFileSelection(files: File[]): void {
    // Reset previous state
    this.state.error = null;
    this.state.success = false;
    this.state.validationResults = null;
    this.state.parsedData = null;
    this.state.showPreview = false;

    // Validate and add each file
    const validFiles: FileUploadItem[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        validFiles.push({
          file,
          status: 'pending',
          progress: 0
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    // Show error message for rejected files
    if (errors.length > 0 && validFiles.length > 0) {
      // Some files valid, some invalid - show temporary warning
      console.warn(`Some files were rejected:\n${errors.join('\n')}`);
    } else if (errors.length > 0 && validFiles.length === 0) {
      // All files invalid - show error
      this.state.error = `All files were rejected:\n${errors.join('\n')}`;
      this.state.selectedFiles = [];
      return;
    }

    this.state.selectedFiles = validFiles;
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

  // Parse and validate the selected files
  async parseFile(): Promise<void> {
    if (this.state.selectedFiles.length === 0) {
      this.state.error = 'No files selected';
      return;
    }

    this.state.isUploading = true;
    this.state.error = null;

    try {
      // Process each file sequentially
      for (let i = 0; i < this.state.selectedFiles.length; i++) {
        const fileItem = this.state.selectedFiles[i];
        this.state.currentFileIndex = i;
        
        fileItem.status = 'parsing';
        this.state.uploadProgress = { 
          stage: 'parsing', 
          message: `Parsing file ${i + 1}/${this.state.selectedFiles.length}: ${fileItem.file.name}...`, 
          percentage: Math.round(((i + 0.5) / this.state.selectedFiles.length) * 50)
        };

        try {
          const result = await this.excelParsingService.parseFile(fileItem.file);

          fileItem.status = 'validating';
          fileItem.progress = 80;
          
          // Store parsed data in the file item
          fileItem.validationResults = result.validation;
          fileItem.parsedData = result.data;
          fileItem.detectedType = result.type;
          fileItem.site = result.site;
          fileItem.borehole = result.borehole;
          fileItem.series = result.series || [];
          fileItem.quality = result.quality || [];

          console.log(`File ${i + 1} - Detected type:`, result.type);

          // Check if validation passed
          if (!result.validation.isValid) {
            fileItem.status = 'error';
            fileItem.error = 'Validation failed. See errors below.';
            fileItem.progress = 100;
          } else {
            fileItem.status = 'pending';
            fileItem.progress = 100;
          }

        } catch (error: any) {
          console.error(`Error parsing file ${fileItem.file.name}:`, error);
          fileItem.status = 'error';
          fileItem.error = error.message || 'Failed to parse file.';
          fileItem.progress = 100;
        }
      }

      this.state.uploadProgress = { 
        stage: 'validating', 
        message: 'All files parsed. Ready to upload.', 
        percentage: 100 
      };

      // Show preview
      this.state.showPreview = true;
      this.state.isUploading = false;

      // Set active file to first one for preview
      if (this.state.selectedFiles.length > 0) {
        this.setActiveFile(0);
      }

    } catch (error: any) {
      console.error('Error during batch parsing:', error);
      this.state.error = error.message || 'Failed to parse files.';
      this.state.isUploading = false;
      this.state.uploadProgress = { stage: 'error', message: 'Parsing failed', percentage: 0 };
    }
  }


  // Confirm and save to Firestore
  async confirmUpload(): Promise<void> {
    // Get all valid files
    const validFiles = this.state.selectedFiles.filter(
      f => f.status === 'pending' && f.validationResults?.isValid && f.parsedData
    );

    if (validFiles.length === 0) {
      this.state.error = 'No valid files to upload';
      return;
    }

    this.state.isUploading = true;
    this.state.error = null;

    let successCount = 0;
    let errorCount = 0;

    try {
      // Process each valid file
      for (let i = 0; i < validFiles.length; i++) {
        const fileItem = validFiles[i];
        this.state.currentFileIndex = this.state.selectedFiles.indexOf(fileItem);
        
        fileItem.status = 'uploading';
        this.state.uploadProgress = { 
          stage: 'saving', 
          message: `Uploading file ${i + 1}/${validFiles.length}: ${fileItem.file.name}...`, 
          percentage: Math.round((i / validFiles.length) * 100)
        };

        try {
          // Save data based on type
          if (this.isReport(fileItem.parsedData!)) {
            const report = fileItem.parsedData as Report;
            await this.firestoreService.saveReport(report);

            // Generate invoice for the progress report
            try {
              const invoiceExists = await this.invoiceService.invoiceExistsForReport(report.reportId);

              if (!invoiceExists) {
                const config = await this.invoiceConfigService.getConfig(report.orgId);
                const invoice = await this.invoiceService.generateInvoiceFromReport(report, config);
                await this.invoiceService.saveInvoice(invoice);
                await this.invoiceConfigService.incrementInvoiceNumber(report.orgId);
                console.log('Invoice generated successfully:', invoice.invoiceNumber);
              } else {
                console.log('Invoice already exists for report:', report.reportId);
              }
            } catch (invoiceError: any) {
              console.error('Error generating invoice:', invoiceError);
            }
          } else if (this.isAquiferTest(fileItem.parsedData!)) {
            await this.firestoreService.saveAquiferTest(fileItem.parsedData as AquiferTest);
          } else if (this.isDischargeTest(fileItem.parsedData!)) {
            const test = fileItem.parsedData as DischargeTest;
            const sourcePath = `uploads/${fileItem.file.name}`;
            test.sourceFilePath = sourcePath;

            if (fileItem.site && fileItem.borehole) {
              await this.firestoreService.saveBoreholeData(
                fileItem.site,
                fileItem.borehole,
                test
              );

              await this.firestoreService.saveSeriesData(
                fileItem.site.siteId,
                fileItem.borehole.boreholeNo,
                fileItem.series || []
              );

              await this.firestoreService.saveQualityData(
                fileItem.site.siteId,
                fileItem.borehole.boreholeNo,
                fileItem.quality || []
              );

              const totalPoints = (fileItem.series || []).reduce((sum, s) => sum + s.points.length, 0);
              await this.firestoreService.saveParseJob({
                jobId: `job-${Date.now()}`,
                testRef: `sites/${fileItem.site.siteId}_${fileItem.borehole.boreholeNo}`,
                status: 'parsed',
                warnings: fileItem.validationResults?.warnings || [],
                counts: {
                  series: fileItem.series?.length || 0,
                  points: totalPoints
                },
                sourceFilePath: sourcePath,
                createdBy: 'user-id', // TODO: Get from Auth
                createdAt: Timestamp.now()
              });
            }
          }

          fileItem.status = 'success';
          fileItem.progress = 100;
          successCount++;

        } catch (error: any) {
          console.error(`Error saving file ${fileItem.file.name}:`, error);
          fileItem.status = 'error';
          fileItem.error = error.message || 'Failed to save data';
          fileItem.progress = 100;
          errorCount++;
        }
      }

      this.state.uploadProgress = { 
        stage: 'complete', 
        message: `Upload complete: ${successCount} succeeded, ${errorCount} failed`, 
        percentage: 100 
      };
      this.state.isUploading = false;

      // Show summary notification
      if (errorCount === 0) {
        this.state.success = true;
        Swal.fire({
          title: 'Success!',
          text: `All ${successCount} file(s) have been successfully uploaded.`,
          icon: 'success',
          confirmButtonColor: '#3B82F6',
          timer: 3000,
          timerProgressBar: true
        }).then(() => {
          this.resetUpload();
        });
      } else {
        Swal.fire({
          title: 'Partial Success',
          text: `${successCount} file(s) uploaded successfully, ${errorCount} failed.`,
          icon: 'warning',
          confirmButtonColor: '#3B82F6'
        });
      }

    } catch (error: any) {
      console.error('Error during batch upload:', error);
      this.state.error = error.message || 'Failed to upload files';
      this.state.isUploading = false;
      this.state.uploadProgress = { stage: 'error', message: 'Upload failed', percentage: 0 };
    }
  }

  // Set active preview tab
  setActiveTab(tab: string): void {
    this.state.activeTab = tab;
  }

  // Set active file for preview
  setActiveFile(index: number): void {
    if (index >= 0 && index < this.state.selectedFiles.length) {
      this.state.currentFileIndex = index;
      const fileItem = this.state.selectedFiles[index];
      
      // Update state with this file's data
      this.state.validationResults = fileItem.validationResults || null;
      this.state.parsedData = fileItem.parsedData || null;
      this.state.detectedType = fileItem.detectedType || 'unknown';
      this.state.site = fileItem.site || null;
      this.state.borehole = fileItem.borehole || null;
      this.state.series = fileItem.series || [];
      this.state.quality = fileItem.quality || [];

      // Set default active tab based on data type
      if (fileItem.detectedType === 'progress_report') {
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
    }
  }

  // Remove a file from the selection
  removeFile(index: number): void {
    // Update currentFileIndex if needed
    if (this.state.currentFileIndex === index) {
      // If removing the active file, reset to -1
      this.state.currentFileIndex = -1;
    } else if (this.state.currentFileIndex > index) {
      // If removing a file before the active one, decrement the index
      this.state.currentFileIndex--;
    }
    
    this.state.selectedFiles.splice(index, 1);
    if (this.state.selectedFiles.length === 0) {
      this.resetUpload();
    } else if (this.state.showPreview && this.state.currentFileIndex === -1) {
      // If in preview mode and no active file, set to first file
      this.setActiveFile(0);
    }
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
      selectedFiles: [],
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
      chartData: null,
      currentFileIndex: -1
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

  // Get status badge class for file item
  getStatusClass(status: string): string {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'parsing': return 'bg-yellow-100 text-yellow-800';
      case 'validating': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Get status icon for file item
  getStatusIcon(status: string): string {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'uploading': return '↑';
      case 'parsing': return '⟳';
      case 'validating': return '◉';
      default: return '○';
    }
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

