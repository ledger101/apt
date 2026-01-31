import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Timestamp } from '@angular/fire/firestore';
import { Report, Shift, Activity, Personnel, ValidationResult, AquiferTest, AquiferDataPoint, Borehole, DischargePoint, Series, Quality, DischargeTest, ParseJob } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExcelParsingService {

  private readonly SHEET_NAME = 'Daily report drilling';

  // Cell reference mappings for Stepped Discharge Test Template
  private readonly STEPPED_DISCHARGE_CELLS = {
    metadata: {
      // Column A labels, Column C values
      projectNo: 'C5',
      boreholeNo: 'C6',
      altBhNo: 'C7',
      boreholeDepthm: 'C9',
      staticWLmbdl: 'C10',
      pumpDepthm: 'C11',
      
      // Column F labels, Column H values (Middle block)
      mapRef: 'H5',
      latitude: 'H6',
      longitude: 'H7',
      elevationm: 'H8',
      datumAboveCasingm: 'H9',
      casingHeightmagl: 'H10',
      pumpInletDiammm: 'H11',
      
      // Column K labels, Column M values (Right block)
      province: 'M5',
      district: 'M6',
      siteName: 'M7',
      existingPump: 'M9',
      contractor: 'M10',
      pumpType: 'M11',
      
      // Optional/Unused in screenshot but kept for compatibility
      client: 'I11', 
      swlmbch: 'C13'
    },
    rates: [
      {
        rateIndex: 1,
        titleRow: 13,
        date: 'C14',
        time: 'F14', // Assuming Time value is in F14 (label in E14?)
        dataStartRow: 17,
        dataEndRow: 40, // Estimated end
        timeCol: 'A',
        wlCol: 'B',
        ddnCol: 'C',
        qCol: 'D',
        // Quality params - guessing location or blank
        phRow: 41, phCol: 'C',
        tempRow: 41, tempCol: 'D',
        ecRow: 42, ecCol: 'D'
      },
      {
        rateIndex: 2,
        titleRow: 13,
        date: 'H14',
        time: 'J14', // Spacer?
        dataStartRow: 17,
        dataEndRow: 40,
        timeCol: 'F',
        wlCol: 'G',
        ddnCol: 'H',
        qCol: 'I',
        phRow: 41, phCol: 'H',
        tempRow: 41, tempCol: 'I',
        ecRow: 42, ecCol: 'I'
      }
      // Add Rate 3, 4 placeholders if needed typically below Rate 1/2
      // For now limiting to what is visible to prevent errors
    ],
    recovery: {
      titleRow: 13,
      dataStartRow: 17,
      dataEndRow: 40,
      timeCol: 'K',
      wlCol: 'L',
      recoveryCol: 'M'
    }
  };

  // Cell reference mappings for Constant Discharge Test Template
  // Based on Excel layout: Row 9 = Title, Row 10-11 = Test Info, Row 12-15 = Headers, Row 16+ = Data
  // Sections: Discharge Borehole (A-F), Obs Hole 1 (G-J), Obs Hole 2 (K-N), Obs Hole 3 (O-R)
  private readonly CONSTANT_DISCHARGE_CELLS = {
    metadata: {
      // Header row info
      boreholeNo: 'C3',       // Borehole No
      siteName: 'P4',         // Site Name
      client: 'P5',           // Client
      contractor: 'C7',       // Contractor
      altBhNo: 'G5',
      latitude: 'G7',
      longitude: 'G8',
      boreholeDepthm: 'C9',
      datumAboveCasingm: 'G9',
      existingPump: 'C10',
      staticWLm: 'G10',
      casingHeightm: 'C11',
      pumpDepthm: 'G11',
      pumpInletDiammm: 'C12',
      pumpType: 'G12',
      availableDrawdownm: 'C15',
      totalTimePumpedmin: 'G15',
      testDate: 'B11',        // DATE cell in row 11
      startTime: 'E11',       // Start time (9:30)
      testCompleted: 'G11',   // TEST COMPLETED DATE
      testCompletedTime: 'L11' // TEST COMPLETED TIME
    },
    // Discharge Borehole: Columns A-F
    // A=TIME(min), B=WATER LEVEL(m), C=DRAWDOWN(m), D=YIELD(L/S), E=TIME(min) Recovery, F=RECOVERY WATER LEVEL(m)
    discharge: {
      dataStartRow: 16,       // Data starts at row 16 (after headers in rows 13-15)
      dataEndRow: 150,        // Extended range for more data points
      timeCol: 'A',           // TIME (MIN)
      wlCol: 'B',             // WATER LEVEL(m)
      ddnCol: 'C',            // DRAWDOWN(m)
      qCol: 'D'               // YIELD L/S
    },
    // Discharge Borehole Recovery: Columns E-F
    dischargeRecovery: {
      dataStartRow: 16,
      dataEndRow: 150,
      timeCol: 'E',           // TIME (MIN) for recovery
      wlCol: 'F'              // RECOVERY WATER LEVEL (M)
    },
    // Observation Hole 1 (KMM01): Columns G-J
    // G=TIME(min), H=WATER LEVEL(m), I=Drawdown(m), J=RECOVERY WATER LEVEL(M)
    obshole1: {
      dataStartRow: 16,
      dataEndRow: 150,
      timeCol: 'G',           // TIME (min)
      wlCol: 'H',             // WATER LEVEL(m)
      ddnCol: 'I',            // Drawdown (m)
      recoveryCol: 'J'        // RECOVERY WATER LEVEL (M)
    },
    // Observation Hole 2: Columns K-N
    // K=TIME(min), L=WATER LEVEL(m), M=Drawdown(m), N=RECOVERY WATER LEVEL(M)
    obshole2: {
      dataStartRow: 16,
      dataEndRow: 150,
      timeCol: 'K',           // TIME (min)
      wlCol: 'L',             // WATER LEVEL(m)
      ddnCol: 'M',            // Drawdown (m)
      recoveryCol: 'N'        // RECOVERY WATER LEVEL (M)
    },
    // Observation Hole 3: Columns O-R
    // O=TIME(min), P=WATER LEVEL(m), Q=Drawdown(m), R=RECOVERY WATER LEVEL(M)
    obshole3: {
      dataStartRow: 16,
      dataEndRow: 150,
      timeCol: 'O',           // TIME (min)
      wlCol: 'P',             // WATER LEVEL(m)
      ddnCol: 'Q',            // Drawdown (m)
      recoveryCol: 'R'        // RECOVERY WATER LEVEL (M)
    }
  };

  // Header patterns for discharge parsing (legacy fallback)
  private readonly HEADER_PATTERNS = {
    timemin: /^(time|t).min$/i,
    waterlevelm: /^(water\slevel|wl).m$/i,
    drawdownm: /^(draw\sdown|drawdown|dd).m$/i,
    yieldlps: /^(yield|discharge|q).(l.?\/.?s)$/i,
    dischargerate: /^discharge\srate\s(\d+)$/i,
    recoverytitle: /^recovery$/i,
    ph: /^pH\s:?\s$/i,
    tempc: /^temp.c$/i,
    ecuScm: /^ec.(u?s\/cm)$/i,
    obshole: /^observation\shole\s(\d+)$/i,
    dischargebh: /^discharge\s*borehole$/i,
  };

  constructor() { }

  /**
   * Main entry point for parsing any supported Excel file
   */
  async parseFile(file: File): Promise<{
    type: 'progress_report' | 'stepped_discharge' | 'constant_discharge' | 'unknown';
    data: Report | DischargeTest | null;
    borehole: Borehole | null;
    series: Series[];
    quality: Quality[];
    validation: ValidationResult;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const type = this.detectTemplateType(workbook);
          const validation: ValidationResult = { isValid: true, errors: [], warnings: [] };

          if (type === 'progress_report') {
            const result = this.extractReportData(workbook);
            resolve({
              type,
              data: result.data,
              borehole: null,
              series: [],
              quality: [],
              validation: result.validation
            });
          } else if (type === 'stepped_discharge' || type === 'constant_discharge') {
            const result = this.extractDischargeData(workbook, file.name);
            resolve({
              type,
              data: result.data,
              borehole: result.borehole,
              series: result.series,
              quality: result.quality,
              validation: result.validation
            });
          } else {
            validation.isValid = false;
            validation.errors.push('Template type not recognized. Please use a supported Excel template.');
            resolve({
              type: 'unknown',
              data: null,
              borehole: null,
              series: [],
              quality: [],
              validation
            });
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse an Excel workbook file and extract pumping report data with validation
   * @deprecated Use parseFile instead
   */
  async parseExcelFile(file: File): Promise<{ data: Report | null; validation: ValidationResult }> {
    const result = await this.parseFile(file);
    return { data: result.data as Report, validation: result.validation };
  }

  /**
   * Parse an Excel/CSV file for aquifer test data
   * @deprecated Use parseFile instead
   */
  async parseAquiferFile(file: File): Promise<{ data: DischargeTest | null; borehole: Borehole | null; series: Series[]; quality: Quality[]; validation: ValidationResult }> {
    const result = await this.parseFile(file);
    return {
      data: result.data as DischargeTest,
      borehole: result.borehole,
      series: result.series,
      quality: result.quality,
      validation: result.validation
    };
  }


  private extractReportData(workbook: XLSX.WorkBook): { data: Report | null; validation: ValidationResult } {
    const validation: ValidationResult = { isValid: true, errors: [], warnings: [] };

    const sheet = workbook.Sheets[this.SHEET_NAME];
    if (!sheet) {
      validation.isValid = false;
      validation.errors.push('Sheet "Daily report drilling" not found');
      return { data: null, validation };
    }

    // Extract top level fields
    const reportDate = this.getCellValue(sheet, 'I6'); // DATE
    const client = this.getCellValue(sheet, 'D7'); // CLIENT
    const projectSiteArea = this.getCellValue(sheet, 'E9'); // PROJECT/SITE AREA
    const rigNumber = this.extractRigNumber(sheet); // RIG No_1
    const controlBHId = this.getCellValue(sheet, 'D10'); // Control BH_ID
    const obsBH1Id = this.getCellValue(sheet, 'F10'); // OBS_BH_1_ID
    const obsBH2Id = this.getCellValue(sheet, 'H10'); // OBS_BH_2_ID
    const obsBH3Id = this.getCellValue(sheet, 'J10'); // OBS_BH_3_ID
    const challenges = this.extractChallenges(sheet); // CHALLENGES
    const supervisorName = this.getCellValue(sheet, 'B32'); // Supervisor
    const clientRepName = this.getCellValue(sheet, 'B33'); // Client's representative

    // Validate mandatory fields
    if (!reportDate) validation.errors.push('Report Date is required');
    if (!client) validation.errors.push('Client is required');
    if (!projectSiteArea) validation.errors.push('Project/Site Area is required');
    if (!rigNumber) validation.errors.push('Rig Number is required');

    // Extract shifts
    const dayShift = this.extractShift(sheet, 'Day', 13, 22, 'H9', 'J9'); // Activities rows 13-22, times H9 J9
    const nightShift = this.extractShift(sheet, 'Night', 34, 43, 'F31', 'I31'); // Rows 34-43, times F31 I31

    // Personnel for day shift (rows 25-29)
    dayShift.personnel = this.extractPersonnel(sheet, 25, 29);
    // Personnel for night shift (rows 46-50)
    nightShift.personnel = this.extractPersonnel(sheet, 46, 50);

    if (validation.errors.length > 0) validation.isValid = false;

    const report: Report = {
      reportId: `${reportDate}-${projectSiteArea}-${rigNumber}`.replace(/\s+/g, ''),
      orgId: 'default-org', // TODO: from user
      projectId: 'default-project', // TODO
      siteId: 'default-site', // TODO
      rigId: 'default-rig', // TODO
      reportDate: new Date(reportDate),
      client,
      projectSiteArea,
      rigNumber,
      controlBHId,
      obsBH1Id,
      obsBH2Id,
      obsBH3Id,
      challenges,
      supervisorName,
      clientRepName,
      status: 'Draft',
      createdBy: 'user-id', // TODO
      createdAt: new Date(),
      updatedAt: new Date(),
      fileRef: '', // TODO
      checks: {
        templateVersion: '1.0',
        parseWarnings: validation.warnings,
        parseErrors: validation.errors
      },
      dayShift,
      nightShift
    };

    return { data: report, validation };
  }

  private extractDischargeData(workbook: XLSX.WorkBook, filename?: string): { data: DischargeTest | null; borehole: Borehole | null; series: Series[]; quality: Quality[]; validation: ValidationResult } {
    const validation: ValidationResult = { isValid: true, errors: [], warnings: [] };

    // Detect template type and find the correct sheet
    let type: 'stepped_discharge' | 'constant_discharge' | 'unknown' = 'unknown';
    let sheet: XLSX.WorkSheet | null = null;

    for (const name of workbook.SheetNames) {
      const s = workbook.Sheets[name];
      if (!s) continue;

      const hasStepped = this.findCell(s, /STEPPED DISCHARGE TEST & RECOVERY/i) != null;
      const hasConstant = this.findCell(s, /CONSTANT DISCHARGE AND RECOVERY/i) != null;

      if (hasStepped) {
        type = 'stepped_discharge';
        sheet = s;
        break;
      }
      if (hasConstant) {
        type = 'constant_discharge';
        sheet = s;
        break;
      }

      // Heuristic fallback
      const content = JSON.stringify(XLSX.utils.sheet_to_json(s, { header: 1, range: 0 })).toLowerCase();
      if (content.includes('discharge rate 1') || content.includes('stepped discharge')) {
        type = 'stepped_discharge';
        sheet = s;
        break;
      }
      if (content.includes('observation hole 1') || content.includes('constant discharge')) {
        type = 'constant_discharge';
        sheet = s;
        break;
      }
    }

    if (type === 'unknown' || !sheet) {
      validation.isValid = false;
      validation.errors.push('Template not recognized in any sheet');
      return { data: null, borehole: null, series: [], quality: [], validation };
    }

    let result: any;
    if (type === 'stepped_discharge') {
      result = this.parseSteppedDischarge(sheet, validation, filename);
    } else {
      result = this.parseConstantDischarge(sheet, validation, filename);
    }



    if (!result.ok) {
      validation.isValid = false;
      validation.errors.push(result.error);
      return { data: null, borehole: null, series: [], quality: [], validation };
    }

    // Normalize and validate
    const normalized = this.normalizeCommon(result.data, validation);

    // Create models
    const borehole: Borehole = {
      boreholeId: this.slugify(normalized.meta.boreholeNo || normalized.meta.siteName || 'unknown'),
      boreholeNo: normalized.meta.boreholeNo || '',
      siteName: normalized.meta.siteName || '',
      ...(normalized.meta.latitude && normalized.meta.longitude ? { coordinates: { lat: normalized.meta.latitude, lon: normalized.meta.longitude } } : {}),
      client: normalized.meta.client ?? null,
      contractor: normalized.meta.contractor ?? null,
      province: normalized.meta.province ?? null,
      district: normalized.meta.district ?? null,
      elevation_m: normalized.meta.elevationm ?? null,
      boreholeDepth_m: normalized.meta.boreholeDepthm ?? null,
      datumAboveCasing_m: normalized.meta.datumAboveCasingm ?? null,
      existingPump: normalized.meta.existingPump ?? null,
      staticWL_mbdl: normalized.meta.staticWLmbdl ?? null,
      casingHeight_magl: normalized.meta.casingHeightmagl ?? null,
      pumpDepth_m: normalized.meta.pumpDepthm ?? null,
      pumpInletDiam_mm: normalized.meta.pumpInletDiammm ?? null,
      pumpType: normalized.meta.pumpType ?? null,
      swl_mbch: normalized.meta.swlmbch ?? null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const test: DischargeTest = {
      testId: `discharge-${Date.now()}`,
      testType: normalized.testType,
      boreholeRef: `boreholes/${borehole.boreholeId}`,
      ...(normalized.startISO ? { startTime: new Date(normalized.startISO) } : {}),
      ...(normalized.meta.endISO ? { endTime: new Date(normalized.meta.endISO) } : {}),
      summary: {
        availableDrawdown_m: normalized.meta.availableDrawdownm ?? null,
        totalTimePumped_min: normalized.meta.totalTimePumpedmin ?? null,
        staticWL_m: (normalized.meta.staticWLm || normalized.meta.staticWLmbdl) ?? null,
        pump: {
          depth_m: normalized.meta.pumpDepthm ?? null,
          inletDiam_mm: normalized.meta.pumpInletDiammm ?? null,
          type: normalized.meta.pumpType ?? null
        },
        notes: normalized.meta.notes ?? null
      },
      sourceFilePath: '', // to be set later
      status: 'draft',
      createdBy: 'user-id', // TODO
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const series: Series[] = [];
    let seriesIndex = 0;
    for (const s of normalized.series) {
      const chunkSize = 400;
      for (let i = 0; i < s.points.length; i += chunkSize) {
        const page = s.points.slice(i, i + chunkSize);
        series.push({
          seriesId: `${s.seriesType}-${seriesIndex++}`,
          seriesType: s.seriesType as any,
          rateIndex: s.rateIndex,
          pageIndex: i / chunkSize,
          points: page,
          createdAt: Timestamp.now()
        });
      }
    }

    // Quality data is only available for stepped discharge tests
    const quality: Quality[] = (normalized.quality || []).map((q: any, idx: number) => ({
      qualityId: `quality-${idx}`,
      rateIndex: q.rateIndex,
      pH: q.pH,
      tempC: q.tempC,
      ec_uScm: q.ec_uScm,
      createdAt: new Date()
    }));

    return { data: test, borehole, series, quality, validation };
  }

  /**
   * Helper method to get cell value by cell reference (e.g., 'C5')
   */
  private getCellByRef(sheet: XLSX.WorkSheet, cellRef: string): any {
    const cell = sheet[cellRef];
    return cell ? (cell.v ?? cell.w ?? null) : null;
  }

  /**
   * Helper method to extract data from a range using cell references
   */
  private extractDataRange(
    sheet: XLSX.WorkSheet,
    startRow: number,
    endRow: number,
    columns: { [key: string]: string }
  ): any[] {
    const data: any[] = [];
    
    for (let row = startRow; row <= endRow; row++) {
      const rowData: any = {};
      let hasData = false;
      
      for (const [key, col] of Object.entries(columns)) {
        const cellRef = `${col}${row}`;
        const value = this.getCellByRef(sheet, cellRef);
        rowData[key] = value;
        if (value != null && value !== '') hasData = true;
      }
      
      if (hasData) {
        data.push(rowData);
      }
    }
    
    return data;
  }

  /**
   * Convert row-based data to DischargePoint format
   */
  private rowToDischargePoint(row: any, hasYield: boolean = false): DischargePoint | null {
    const point: DischargePoint = {
      t_min: this.ensureNonNegative(this.toFloat(row.time)) || undefined,
      wl_m: this.toFloat(row.wl) || undefined,
      ddn_m: this.toFloat(row.ddn) || undefined
    };
    
    if (hasYield) {
      point.qlps = this.toFloat(row.q) || undefined;
    }
    
    // Only return point if it has at least one non-null value
    if (point.t_min != null || point.wl_m != null || point.ddn_m != null || point.qlps != null) {
      return point;
    }
    
    return null;
  }

  private getCellValue(sheet: XLSX.WorkSheet, cell: string): string {
    const cellRef = sheet[cell];
    if (!cellRef) return '';

    // Prefer formatted value (cell.w) over raw value (cell.v) for times and dates
    // This ensures we get "6:00:00 AM" instead of 0.25
    const value = cellRef.w !== undefined ? cellRef.w : cellRef.v;
    return value?.toString().trim() || '';
  }

  private extractRigNumber(sheet: XLSX.WorkSheet): string {
    const label = this.getCellValue(sheet, 'A9');
    if (label.includes('RIG No')) {
      return label.replace('RIG No_', '').trim();
    }
    return label;
  }

  private extractChallenges(sheet: XLSX.WorkSheet): string[] {
    // Assume challenges in B34:B37 or similar, up to 4
    const challenges: string[] = [];
    for (let i = 52; i <= 55; i++) {
      const val = this.getCellValue(sheet, `B${i}`);
      if (val) challenges.push(val);
    }
    return challenges;
  }

  private extractShift(sheet: XLSX.WorkSheet, label: string, startRow: number, endRow: number, startTimeCell: string, endTimeCell: string): Shift {
    const startTimeRaw = this.getCellValue(sheet, startTimeCell);
    const endTimeRaw = this.getCellValue(sheet, endTimeCell);
    const startTime = this.parseTime(startTimeRaw);
    const endTime = this.parseTime(endTimeRaw);
    const activities: Activity[] = [];

    for (let row = startRow; row <= endRow; row++) {
      const activity = this.getCellValue(sheet, `B${row}`); // Merged B-E
      const from = this.getCellValue(sheet, `F${row}`);
      const to = this.getCellValue(sheet, `G${row}`);
      const total = this.calculateActivityDuration(from, to); // Calculate from from/to times
      const chargeable = this.getCellValue(sheet, `I${row}`) !== ''; // Or check J for No

      console.log(`B${row}`);
      console.log(activity);


      if (activity || from || to) {
        activities.push({
          order: row - startRow + 1,
          activity,
          from,
          to,
          total,
          chargeable
        });
      }
    }

    // Calculate totals
    const totalHours = activities.reduce((sum, a) => sum + this.parseDuration(a.total), 0);
    const chargeableHours = activities.filter(a => a.chargeable).reduce((sum, a) => sum + this.parseDuration(a.total), 0);

    return {
      startTime,
      endTime,
      totalHours,
      chargeableHours,
      activities,
      personnel: [] // Will be set later
    };
  }

  private extractPersonnel(sheet: XLSX.WorkSheet, startRow: number, endRow: number): Personnel[] {
    const personnel: Personnel[] = [];
    for (let row = startRow; row <= endRow; row++) {
      const name1 = this.getCellValue(sheet, `B${row}`);
      const hours1 = parseFloat(this.getCellValue(sheet, `F${row}`)) || 0;
      if (name1) personnel.push({ name: name1, hoursWorked: hours1 });

      const name2 = this.getCellValue(sheet, `G${row}`);
      const hours2 = parseFloat(this.getCellValue(sheet, `J${row}`)) || 0;
      if (name2) personnel.push({ name: name2, hoursWorked: hours2 });
    }
    return personnel;
  }

  private parseDuration(duration: string): number {
    // Parse "H:MM" to hours
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) + parseInt(parts[1]) / 60;
    }
    return 0;
  }

  private calculateActivityDuration(fromTime: string, toTime: string): string {
    if (!fromTime || !toTime) return '';

    try {
      const fromParsed = this.parseTime(fromTime);
      const toParsed = this.parseTime(toTime);

      if (!fromParsed || !toParsed) return '';

      // Convert HH:MM to minutes since midnight
      const fromParts = fromParsed.split(':').map(Number);
      const toParts = toParsed.split(':').map(Number);

      const fromMinutes = fromParts[0] * 60 + fromParts[1];
      const toMinutes = toParts[0] * 60 + toParts[1];

      // Calculate duration in minutes
      let durationMinutes = toMinutes - fromMinutes;

      // Handle overnight shifts (if toTime is next day)
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Add 24 hours
      }

      // Convert back to H:MM format
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.warn('Failed to calculate duration:', fromTime, 'to', toTime, error);
      return '';
    }
  }

  private parseTime(timeString: string): string {
    if (!timeString) return '';

    try {
      // First try parsing as full date-time string like "8/22/1901  6:00:00 AM"
      let date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }

      // If that fails, try parsing time-only format like "6:00:00 PM"
      const timeRegex = /^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i;
      const match = timeString.trim().match(timeRegex);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[4].toUpperCase();

        if (ampm === 'PM' && hours !== 12) {
          hours += 12;
        } else if (ampm === 'AM' && hours === 12) {
          hours = 0;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }

      // If all parsing fails, return as is
      return timeString;
    } catch (error) {
      console.warn('Failed to parse time:', timeString, error);
      return timeString;
    }
  }

  // New methods for discharge parsing
  private detectTemplateType(workbook: XLSX.WorkBook): 'progress_report' | 'stepped_discharge' | 'constant_discharge' | 'unknown' {
    // 1. Check for Progress Report sheet by name (as it's a fixed name template)
    if (workbook.Sheets[this.SHEET_NAME]) {
      return 'progress_report';
    }

    // 2. Check all sheets for Discharge test patterns
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const hasStepped = this.findCell(sheet, /STEPPED DISCHARGE TEST & RECOVERY/i) != null;
      if (hasStepped) return 'stepped_discharge';

      const hasConstant = this.findCell(sheet, /CONSTANT DISCHARGE AND RECOVERY/i) != null;
      if (hasConstant) return 'constant_discharge';

      // Fallback heuristics per sheet
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });
      const content = JSON.stringify(sheetData).toLowerCase();

      if (content.includes('discharge rate 1') || content.includes('stepped discharge')) {
        return 'stepped_discharge';
      }
      if (content.includes('observation hole 1') || content.includes('constant discharge')) {
        return 'constant_discharge';
      }
    }

    return 'unknown';
  }



  private parseSteppedDischarge(sheet: XLSX.WorkSheet, validation: ValidationResult, filename?: string): { ok: boolean; data?: any; error?: string } {
    const meta: any = {};
    const cellMap = this.STEPPED_DISCHARGE_CELLS.metadata;
    
    // Extract metadata using cell references
    meta.projectNo = this.getCellByRef(sheet, cellMap.projectNo);
    meta.mapRef = this.getCellByRef(sheet, cellMap.mapRef);
    meta.province = this.getCellByRef(sheet, cellMap.province);
    meta.boreholeNo = this.getCellByRef(sheet, cellMap.boreholeNo);
    meta.altBhNo = this.getCellByRef(sheet, cellMap.altBhNo);
    meta.siteName = this.getCellByRef(sheet, cellMap.siteName);
    meta.district = this.getCellByRef(sheet, cellMap.district);
    
    // Parse coordinates
    const latStr = this.getCellByRef(sheet, cellMap.latitude);
    const lonStr = this.getCellByRef(sheet, cellMap.longitude);
    meta.latitude = this.parseCoordinate(latStr);
    meta.longitude = this.parseCoordinate(lonStr);
    
    // Extract numeric metadata
    meta.elevationm = this.toFloat(this.getCellByRef(sheet, cellMap.elevationm));
    meta.boreholeDepthm = this.toFloat(this.getCellByRef(sheet, cellMap.boreholeDepthm));
    meta.datumAboveCasingm = this.toFloat(this.getCellByRef(sheet, cellMap.datumAboveCasingm));
    meta.existingPump = this.getCellByRef(sheet, cellMap.existingPump);
    meta.staticWLmbdl = this.toFloat(this.getCellByRef(sheet, cellMap.staticWLmbdl));
    meta.casingHeightmagl = this.toFloat(this.getCellByRef(sheet, cellMap.casingHeightmagl));
    meta.contractor = this.getCellByRef(sheet, cellMap.contractor);
    meta.client = this.getCellByRef(sheet, cellMap.client);
    meta.pumpDepthm = this.toFloat(this.getCellByRef(sheet, cellMap.pumpDepthm));
    meta.pumpInletDiammm = this.toFloat(this.getCellByRef(sheet, cellMap.pumpInletDiammm));
    meta.pumpType = this.getCellByRef(sheet, cellMap.pumpType);
    meta.swlmbch = this.toFloat(this.getCellByRef(sheet, cellMap.swlmbch));

    // Validation for required fields with fallback
    if (!meta.boreholeNo && !meta.siteName) {
      const fallback = filename ? filename.split('.')[0] : 'Unknown-Borehole';
      meta.boreholeNo = fallback;
      validation.warnings.push(`Borehole No/Site Name not found in file. Using filename "${fallback}" as a placeholder.`);
    }

    let startISO: string | null = null;
    const series: any[] = [];
    const quality: any[] = [];

    // Parse all 6 discharge rates using cell references
    for (const rateConfig of this.STEPPED_DISCHARGE_CELLS.rates) {
      const dateVal = this.getCellByRef(sheet, rateConfig.date);
      const timeVal = this.getCellByRef(sheet, rateConfig.time);
      
      // Extract start date/time for this rate
      // Ensure dateVal is treated as date and timeVal is treated as time
      const rateStartISO = this.parseExcelDateTime(dateVal, timeVal);
      if (!startISO && rateStartISO) startISO = rateStartISO;

      // Extract data points using cell references
      const rawData = this.extractDataRange(sheet, rateConfig.dataStartRow, rateConfig.dataEndRow, {
        time: rateConfig.timeCol,
        wl: rateConfig.wlCol,
        ddn: rateConfig.ddnCol,
        q: rateConfig.qCol
      });

      // Convert to DischargePoint format
      const points: DischargePoint[] = [];
      for (const row of rawData) {
        // Ensure time is treated as number (minutes)
        const t = this.toFloat(row.time);
        const wl = this.toFloat(row.wl);
        const ddn = this.toFloat(row.ddn);
        const q = this.toFloat(row.q);
        
        const point: DischargePoint = {
           t_min: this.ensureNonNegative(t) || undefined,
           wl_m: wl || undefined,
           ddn_m: ddn || undefined,
           qlps: q || undefined
        };

        if (point.t_min != null || point.wl_m != null || point.ddn_m != null || point.qlps != null) {
          points.push(point);
        }
      }

      if (points.length > 0) {
        series.push({ 
          seriesType: 'discharge_rate', 
          rateIndex: rateConfig.rateIndex, 
          points 
        });
      }

      // Extract quality parameters using cell references
      const phCell = `${rateConfig.phCol}${rateConfig.phRow}`;
      const tempCell = `${rateConfig.tempCol}${rateConfig.tempRow}`;
      const ecCell = `${rateConfig.ecCol}${rateConfig.ecRow}`;
      
      const phVal = this.toFloat(this.getCellByRef(sheet, phCell));
      const tempVal = this.toFloat(this.getCellByRef(sheet, tempCell));
      const ecVal = this.toFloat(this.getCellByRef(sheet, ecCell));

      if (phVal != null || tempVal != null || ecVal != null) {
        quality.push({
          rateIndex: rateConfig.rateIndex,
          pH: phVal,
          tempC: tempVal,
          ec_uScm: ecVal
        });
      }
    }

    // Parse recovery data using cell references
    const recoveryConfig = this.STEPPED_DISCHARGE_CELLS.recovery;
    const recoveryRawData = this.extractDataRange(sheet, recoveryConfig.dataStartRow, recoveryConfig.dataEndRow, {
      time: recoveryConfig.timeCol,
      wl: recoveryConfig.wlCol,
      recovery: recoveryConfig.recoveryCol
    });

    const recoveryPoints: { t_min?: number; wl_m?: number; recoverym?: number }[] = [];
    for (const row of recoveryRawData) {
      const t = this.ensureNonNegative(this.toFloat(row.time));
      const wl = this.toFloat(row.wl);
      const rec = this.toFloat(row.recovery);
      
      if (t != null || wl != null || rec != null) {
        recoveryPoints.push({
          t_min: t ?? undefined,
          wl_m: wl ?? undefined,
          recoverym: rec ?? undefined
        });
      }
    }

    if (recoveryPoints.length > 0) {
      series.push({ seriesType: 'recovery', points: recoveryPoints });
    }

    if (series.length === 0) {
      validation.warnings.push('No test data points found in the expected cell ranges.');
    }

    return {
      ok: true,
      data: {
        testType: 'stepped_discharge',
        meta,
        startISO,
        series,
        quality
      }
    };
  }


  private parseConstantDischarge(sheet: XLSX.WorkSheet, validation: ValidationResult, filename?: string): { ok: boolean; data?: any; error?: string } {
    const meta: any = {};
    const cellMap = this.CONSTANT_DISCHARGE_CELLS.metadata;
    
    // Extract metadata
    meta.boreholeNo = this.getCellByRef(sheet, cellMap.boreholeNo);
    meta.siteName = this.getCellByRef(sheet, cellMap.siteName);
    meta.client = this.getCellByRef(sheet, cellMap.client);
    meta.contractor = this.getCellByRef(sheet, cellMap.contractor);
    meta.altBhNo = this.getCellByRef(sheet, cellMap.altBhNo);
    
    // Parse coordinates
    const latStr = this.getCellByRef(sheet, cellMap.latitude);
    const lonStr = this.getCellByRef(sheet, cellMap.longitude);
    meta.latitude = this.parseCoordinate(latStr);
    meta.longitude = this.parseCoordinate(lonStr);
    
    // Extract numeric metadata
    meta.boreholeDepthm = this.toFloat(this.getCellByRef(sheet, cellMap.boreholeDepthm));
    meta.datumAboveCasingm = this.toFloat(this.getCellByRef(sheet, cellMap.datumAboveCasingm));
    meta.existingPump = this.getCellByRef(sheet, cellMap.existingPump);
    meta.staticWLm = this.toFloat(this.getCellByRef(sheet, cellMap.staticWLm));
    meta.casingHeightm = this.toFloat(this.getCellByRef(sheet, cellMap.casingHeightm));
    meta.pumpDepthm = this.toFloat(this.getCellByRef(sheet, cellMap.pumpDepthm));
    meta.pumpInletDiammm = this.toFloat(this.getCellByRef(sheet, cellMap.pumpInletDiammm));
    meta.pumpType = this.getCellByRef(sheet, cellMap.pumpType);
    meta.availableDrawdownm = this.toFloat(this.getCellByRef(sheet, cellMap.availableDrawdownm));
    meta.totalTimePumpedmin = this.toFloat(this.getCellByRef(sheet, cellMap.totalTimePumpedmin));
    
    // Extract test date and time from the header row
    const testDateVal = this.getCellByRef(sheet, cellMap.testDate);
    const startTimeVal = this.getCellByRef(sheet, cellMap.startTime);
    const testCompletedDateVal = this.getCellByRef(sheet, cellMap.testCompleted);
    const testCompletedTimeVal = this.getCellByRef(sheet, cellMap.testCompletedTime);
    
    // Parse test start date/time
    meta.startISO = this.parseExcelDateTime(testDateVal, startTimeVal);
    meta.endISO = this.parseExcelDateTime(testCompletedDateVal, testCompletedTimeVal);

    // Use filename as borehole identifier if no other identifier is found
    if (!meta.boreholeNo && !meta.siteName) {
      const fallback = filename ? filename.split('.')[0] : 'Unknown-Borehole';
      meta.boreholeNo = fallback;
      validation.warnings.push(`Borehole No/Site Name not found in file. Using filename "${fallback}" as a placeholder.`);
    }

    const series: any[] = [];
    console.log('Extracting Constant Discharge data with corrected cell references...', meta);

    // Helper to check if series has any meaningful data (not just timestamps)
    const hasData = (points: DischargePoint[], checkKeys: (keyof DischargePoint)[] = ['wl_m', 'ddn_m', 'qlps']) => {
      // Check if there is at least one point with a non-null value for the specified keys
      // OR if we skip the first few empty rows, maybe the rest has data?
      // Since we already filtered out rows that are entirely empty/null during extraction,
      // we now check if the extracted points have anything more than just time.
      return points.some(p => checkKeys.some(k => p[k] != null));
    };

    // Extract discharge borehole data (Columns A-D)
    const dischargeConfig = this.CONSTANT_DISCHARGE_CELLS.discharge;
    const dischargePoints: DischargePoint[] = [];
    
    for (let row = dischargeConfig.dataStartRow; row <= dischargeConfig.dataEndRow; row++) {
      const timeVal = this.getRawCellValue(sheet, `${dischargeConfig.timeCol}${row}`);
      const wlVal = this.getRawCellValue(sheet, `${dischargeConfig.wlCol}${row}`);
      const ddnVal = this.getRawCellValue(sheet, `${dischargeConfig.ddnCol}${row}`);
      const qVal = this.getRawCellValue(sheet, `${dischargeConfig.qCol}${row}`);
      
      // Check if row has any data
      if (timeVal == null && wlVal == null && ddnVal == null && qVal == null) continue;
      
      const point: DischargePoint = {
        t_min: this.toFloat(timeVal) ?? undefined,
        wl_m: this.toFloat(wlVal) ?? undefined,
        ddn_m: this.toFloat(ddnVal) ?? undefined,
        qlps: this.toFloat(qVal) ?? undefined
      };
      
      // Only add if we have at least time or water level
      if (point.t_min != null || point.wl_m != null) {
        dischargePoints.push(point);
      }
    }

    if (dischargePoints.length > 0 && hasData(dischargePoints)) {
      series.push({ seriesType: 'discharge', points: dischargePoints });
      console.log(`Extracted ${dischargePoints.length} discharge borehole points`);
    }

    // Extract discharge borehole recovery data (Columns E-F)
    const dischargeRecoveryConfig = this.CONSTANT_DISCHARGE_CELLS.dischargeRecovery;
    const dischargeRecoveryPoints: DischargePoint[] = [];
    
    for (let row = dischargeRecoveryConfig.dataStartRow; row <= dischargeRecoveryConfig.dataEndRow; row++) {
      const timeVal = this.getRawCellValue(sheet, `${dischargeRecoveryConfig.timeCol}${row}`);
      const wlVal = this.getRawCellValue(sheet, `${dischargeRecoveryConfig.wlCol}${row}`);
      
      if (timeVal == null && wlVal == null) continue;
      
      const point: DischargePoint = {
        t_min: this.toFloat(timeVal) ?? undefined,
        wl_m: this.toFloat(wlVal) ?? undefined
      };
      
      if (point.t_min != null || point.wl_m != null) {
        dischargeRecoveryPoints.push(point);
      }
    }

    if (dischargeRecoveryPoints.length > 0 && hasData(dischargeRecoveryPoints, ['wl_m'])) {
      series.push({ seriesType: 'discharge_recovery', points: dischargeRecoveryPoints });
      console.log(`Extracted ${dischargeRecoveryPoints.length} discharge recovery points`);
    }

    // Extract observation hole 1 data (Columns G-J) with recovery
    const obs1Config = this.CONSTANT_DISCHARGE_CELLS.obshole1;
    const obs1Points: DischargePoint[] = [];
    const obs1RecoveryPoints: DischargePoint[] = [];
    
    for (let row = obs1Config.dataStartRow; row <= obs1Config.dataEndRow; row++) {
      const timeVal = this.getRawCellValue(sheet, `${obs1Config.timeCol}${row}`);
      const wlVal = this.getRawCellValue(sheet, `${obs1Config.wlCol}${row}`);
      const ddnVal = this.getRawCellValue(sheet, `${obs1Config.ddnCol}${row}`);
      const recoveryVal = this.getRawCellValue(sheet, `${obs1Config.recoveryCol}${row}`);
      
      if (timeVal == null && wlVal == null && ddnVal == null && recoveryVal == null) continue;
      
      // Main observation data
      if (timeVal != null || wlVal != null || ddnVal != null) {
        const point: DischargePoint = {
          t_min: this.toFloat(timeVal) ?? undefined,
          wl_m: this.toFloat(wlVal) ?? undefined,
          ddn_m: this.toFloat(ddnVal) ?? undefined
        };
        if (point.t_min != null || point.wl_m != null) {
          obs1Points.push(point);
        }
      }
      
      // Recovery data (uses same time column)
      if (recoveryVal != null) {
        const recoveryPoint: DischargePoint = {
          t_min: this.toFloat(timeVal) ?? undefined,
          wl_m: this.toFloat(recoveryVal) ?? undefined
        };
        obs1RecoveryPoints.push(recoveryPoint);
      }
    }

    if (obs1Points.length > 0 && hasData(obs1Points)) {
      series.push({ seriesType: 'obshole1', points: obs1Points });
      console.log(`Extracted ${obs1Points.length} observation hole 1 points`);
    }
    if (obs1RecoveryPoints.length > 0 && hasData(obs1RecoveryPoints, ['wl_m'])) {
      series.push({ seriesType: 'obshole1_recovery', points: obs1RecoveryPoints });
    }

    // Extract observation hole 2 data (Columns K-N)
    const obs2Config = this.CONSTANT_DISCHARGE_CELLS.obshole2;
    const obs2Points: DischargePoint[] = [];
    const obs2RecoveryPoints: DischargePoint[] = [];
    
    for (let row = obs2Config.dataStartRow; row <= obs2Config.dataEndRow; row++) {
      const timeVal = this.getRawCellValue(sheet, `${obs2Config.timeCol}${row}`);
      const wlVal = this.getRawCellValue(sheet, `${obs2Config.wlCol}${row}`);
      const ddnVal = this.getRawCellValue(sheet, `${obs2Config.ddnCol}${row}`);
      const recoveryVal = this.getRawCellValue(sheet, `${obs2Config.recoveryCol}${row}`);
      
      if (timeVal == null && wlVal == null && ddnVal == null && recoveryVal == null) continue;
      
      if (timeVal != null || wlVal != null || ddnVal != null) {
        const point: DischargePoint = {
          t_min: this.toFloat(timeVal) ?? undefined,
          wl_m: this.toFloat(wlVal) ?? undefined,
          ddn_m: this.toFloat(ddnVal) ?? undefined
        };
        if (point.t_min != null || point.wl_m != null) {
          obs2Points.push(point);
        }
      }
      
      if (recoveryVal != null) {
        const recoveryPoint: DischargePoint = {
          t_min: this.toFloat(timeVal) ?? undefined,
          wl_m: this.toFloat(recoveryVal) ?? undefined
        };
        obs2RecoveryPoints.push(recoveryPoint);
      }
    }

    if (obs2Points.length > 0 && hasData(obs2Points)) {
      series.push({ seriesType: 'obshole2', points: obs2Points });
      console.log(`Extracted ${obs2Points.length} observation hole 2 points`);
    }
    if (obs2RecoveryPoints.length > 0 && hasData(obs2RecoveryPoints, ['wl_m'])) {
      series.push({ seriesType: 'obshole2_recovery', points: obs2RecoveryPoints });
    }

    // Extract observation hole 3 data (Columns O-R)
    const obs3Config = this.CONSTANT_DISCHARGE_CELLS.obshole3;
    const obs3Points: DischargePoint[] = [];
    const obs3RecoveryPoints: DischargePoint[] = [];
    
    for (let row = obs3Config.dataStartRow; row <= obs3Config.dataEndRow; row++) {
      const timeVal = this.getRawCellValue(sheet, `${obs3Config.timeCol}${row}`);
      const wlVal = this.getRawCellValue(sheet, `${obs3Config.wlCol}${row}`);
      const ddnVal = this.getRawCellValue(sheet, `${obs3Config.ddnCol}${row}`);
      const recoveryVal = this.getRawCellValue(sheet, `${obs3Config.recoveryCol}${row}`);
      
      if (timeVal == null && wlVal == null && ddnVal == null && recoveryVal == null) continue;
      
      if (timeVal != null || wlVal != null || ddnVal != null) {
        const point: DischargePoint = {
          t_min: this.toFloat(timeVal) ?? undefined,
          wl_m: this.toFloat(wlVal) ?? undefined,
          ddn_m: this.toFloat(ddnVal) ?? undefined
        };
        if (point.t_min != null || point.wl_m != null) {
          obs3Points.push(point);
        }
      }
      
      if (recoveryVal != null) {
        const recoveryPoint: DischargePoint = {
          t_min: this.toFloat(timeVal) ?? undefined,
          wl_m: this.toFloat(recoveryVal) ?? undefined
        };
        obs3RecoveryPoints.push(recoveryPoint);
      }
    }

    if (obs3Points.length > 0 && hasData(obs3Points)) {
      series.push({ seriesType: 'obshole3', points: obs3Points });
      console.log(`Extracted ${obs3Points.length} observation hole 3 points`);
    }
    if (obs3RecoveryPoints.length > 0 && hasData(obs3RecoveryPoints, ['wl_m'])) {
      series.push({ seriesType: 'obshole3_recovery', points: obs3RecoveryPoints });
    }

    if (series.length === 0) {
      validation.warnings.push('No test data points found in the expected cell ranges.');
    }

    return {
      ok: true,
      data: {
        testType: 'constant_discharge',
        meta,
        startISO: meta.startISO,
        series
      }
    };
  }

  /**
   * Get raw cell value without any formatting - preserves numeric values exactly as stored
   * This is critical for time values (0.5 = 30 seconds, not converted to date string)
   */
  private getRawCellValue(sheet: XLSX.WorkSheet, cellRef: string): any {
    const cell = sheet[cellRef];
    if (!cell) return null;
    
    // Always prefer the raw value (v) over formatted value (w) for numeric data
    // This ensures 0.5 stays as 0.5 instead of being formatted as a time
    return cell.v ?? null;
  }

  /**
   * Parse Excel date/time values which may be serial numbers or strings
   */
  private parseExcelDateTime(dateVal: any, timeVal?: any): string | null {
    if (dateVal == null) return null;
    
    // If it's a string date like "10-01-26"
    if (typeof dateVal === 'string') {
      try {
        const date = new Date(dateVal);
        if (!isNaN(date.getTime())) {
          if (timeVal) {
            // Parse time string like "9:30"
            const timeParts = String(timeVal).split(':');
            if (timeParts.length >= 2) {
              date.setHours(parseInt(timeParts[0]) || 0);
              date.setMinutes(parseInt(timeParts[1]) || 0);
            }
          }
          return date.toISOString();
        }
      } catch (e) {
        // Continue to try other parsing methods
      }
    }
    
    // If it's an Excel serial date number
    if (typeof dateVal === 'number') {
      return this.excelSerialDateToISO(dateVal, timeVal);
    }
    
    return null;
  }


  private normalizeCommon(parsed: any, validation: ValidationResult): any {
    if (!parsed.meta.boreholeNo && !parsed.meta.siteName) {
      validation.errors.push('Missing borehole/site');
    }
    if (parsed.meta.latitude != null) parsed.meta.latitude = this.parseCoordinate(parsed.meta.latitude);
    if (parsed.meta.longitude != null) parsed.meta.longitude = this.parseCoordinate(parsed.meta.longitude);

    for (const s of parsed.series) {
      s.points = s.points.filter((p: DischargePoint) =>
        (p.t_min == null || p.t_min >= 0) && (p.qlps == null || p.qlps >= 0)
      );
    }
    return parsed;
  }

  // Utility functions
  private norm(s: any): string {
    if (s == null) return '';
    let val = String(s).toLowerCase().trim()
      .replace(/\s+/g, ' ')
      .replace(/°/g, '')
      .replace(/µ/g, 'u');

    // Specific unit normalization instead of global character replacement
    val = val.replace(/\(m\)/g, '.m')
      .replace(/\(mm\)/g, '.mm')
      .replace(/\(min\)/g, '.min')
      .replace(/\(mbdl\)/g, '.mbdl')
      .replace(/\(magl\)/g, '.magl')
      .replace(/\(l\/s\)/g, '.lps');

    return val;
  }

  private findCell(sheet: XLSX.WorkSheet, regex: RegExp): { row: number; col: number } | null {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
    for (let r = range.s.r; r <= Math.min(range.e.r, 100); r++) {
      for (let c = range.s.c; c <= Math.min(range.e.c, 25); c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (cell && regex.test(this.norm(cell.v || cell.w))) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  private getNear(sheet: XLSX.WorkSheet, regex: RegExp): string {
    const label = this.findCell(sheet, regex);
    if (!label) return '';
    for (let dc = 1; dc <= 4; dc++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: label.row, c: label.col + dc })];
      if (cell && (cell.v || cell.w)) return (cell.w || cell.v).toString().trim();
    }
    const cell = sheet[XLSX.utils.encode_cell({ r: label.row + 1, c: label.col })];
    if (cell && (cell.v || cell.w)) return (cell.w || cell.v).toString().trim();
    return '';
  }

  private mapHeaders(sheet: XLSX.WorkSheet, headerRow: number, expectedMap: { [key: string]: RegExp }): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
    // We check both the headerRow and the row below it for split headers
    for (let c = range.s.c; c <= Math.min(range.e.c, 35); c++) {
      const cell1 = sheet[XLSX.utils.encode_cell({ r: headerRow, c })];
      const cell2 = sheet[XLSX.utils.encode_cell({ r: headerRow + 1, c })];

      const n1 = this.norm(cell1?.v || cell1?.w || '');
      const n2 = this.norm(cell2?.v || cell2?.w || '');
      const verticallyJoined = n1 + n2;

      for (const key in expectedMap) {
        if (result[key] == null) {
          if (expectedMap[key].test(n1) || expectedMap[key].test(n2) || expectedMap[key].test(verticallyJoined)) {
            result[key] = c;
          }
        }
      }
    }
    return result;
  }

  private readTable(sheet: XLSX.WorkSheet, startRow: number, headerRow: number, headerMap: { [key: string]: number }, stopRegexes: RegExp[]): any[] {
    const rows: any[] = [];
    let r = startRow;
    const maxRow = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z1000').e.r;
    while (r <= maxRow) {
      const titleCell = sheet[XLSX.utils.encode_cell({ r, c: headerMap['firstCol'] || 0 })];
      if (titleCell && stopRegexes.some(rx => rx.test(this.norm(titleCell.v || titleCell.w)))) break;

      const values: any = {};
      let empty = true;
      for (const key in headerMap) {
        if (key === 'firstCol') continue;
        const col = headerMap[key];
        const cell = sheet[XLSX.utils.encode_cell({ r, c: col })];
        values[key] = cell ? cell.v || cell.w : null;
        if (values[key] != null) empty = false;
      }
      if (empty) break;
      rows.push(values);
      r++;
    }
    return rows;
  }

  private toFloat(v: any): number | null {
    if (v == null || v === '') return null;
    const s = String(v).replace(/,/g, '').trim();
    const num = parseFloat(s);
    return isNaN(num) ? null : num;
  }

  private ensureNonNegative(n: number | null): number | undefined {
    return n == null ? undefined : Math.max(0, n);
  }

  private normalizeUnitsPoint(p: { time?: any; wl?: any; ddn?: any; q?: any }): DischargePoint {
    return {
      t_min: this.ensureNonNegative(this.toFloat(p.time)) || undefined,
      wl_m: this.toFloat(p.wl) || undefined,
      ddn_m: this.toFloat(p.ddn) || undefined,
      qlps: this.toFloat(p.q) || undefined
    };
  }

  private excelSerialDateToISO(serial: number | null, timeVal?: any, tzOffsetMinutes = 120): string | null {
    if (serial == null) return null;
    const epoch = new Date('1899-12-30T00:00:00Z');
    
    let timeNum = 0;
    let timeStr: string | null = null;
    
    // Determine if timeVal is a number (fraction) or string (HH:MM)
    if (timeVal != null && timeVal !== '') {
      if (typeof timeVal === 'number') {
        timeNum = timeVal;
      } else if (typeof timeVal === 'string') {
        if (timeVal.includes(':')) {
          timeStr = timeVal;
        } else {
          // Try parsing as number
          const n = parseFloat(timeVal);
          if (!isNaN(n)) timeNum = n;
        }
      }
    }

    // Combine date component of serial with time component
    // If timeNum is provided, it replaces any time fraction in serial
    const dateComponent = Math.floor(serial);
    const timeComponent = timeNum > 0 ? timeNum : (serial - dateComponent);
    
    const totalSerial = dateComponent + timeComponent;
    const ms = Math.round(totalSerial * 86400000);
    let dt = new Date(epoch.getTime() + ms);

    // If string time provided, override
    if (timeStr) {
      const [hh, mm, ss] = timeStr.split(':').map(Number);
      dt.setHours(hh || 0, mm || 0, ss || 0);
    }
    
    dt = new Date(dt.getTime() - tzOffsetMinutes * 60000);
    return dt.toISOString();
  }

  private parseCoordinate(value: any): number | null {
    if (!value) return null;
    const s = String(value).trim();
    if (s.includes(',')) {
      const [lat, lon] = s.split(',').map(this.toFloat);
      return lat; // For now, assume latitude
    }
    return this.toFloat(s);
  }

  private findHeaderRowBelow(sheet: XLSX.WorkSheet, startRow: number, patterns: RegExp[]): number | null {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
    for (let r = startRow + 1; r <= Math.min(range.e.r, startRow + 20); r++) {
      const windowText: string[] = [];
      for (let wr = 0; wr <= 2; wr++) { // 3-row window
        if (r + wr > range.e.r) break;
        for (let c = range.s.c; c <= Math.min(range.e.c, 30); c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r: r + wr, c })];
          if (!cell) continue;
          const n = this.norm(cell.v || cell.w);
          windowText.push(n);
          if (wr > 0) {
            const prev = sheet[XLSX.utils.encode_cell({ r: r + wr - 1, c })];
            if (prev) windowText.push(this.norm(prev.v || prev.w) + n);
          }
        }
      }
      if (patterns.every(pat => windowText.some(t => pat.test(t)))) return r;
    }
    return null;
  }


  private readNeighbor(sheet: XLSX.WorkSheet, row: number, col: number, regex: RegExp): string {
    for (let dc = 1; dc <= 6; dc++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col + dc })];
      if (cell && regex.test(this.norm(cell.v || cell.w || ''))) {
        const valCell = sheet[XLSX.utils.encode_cell({ r: row, c: col + dc + 1 })];
        return valCell ? (valCell.w || valCell.v || '').toString() : '';
      }
    }
    for (let dr = 1; dr <= 3; dr++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row + dr, c: col })];
      if (cell && regex.test(this.norm(cell.v || cell.w || ''))) {
        const valCell = sheet[XLSX.utils.encode_cell({ r: row + dr, c: col + 1 })];
        return valCell ? (valCell.w || valCell.v || '').toString() : '';
      }
    }
    return '';
  }

  private findInlineLabelValueBelow(sheet: XLSX.WorkSheet, startRow: number, regex: RegExp, limitRows: number): string {
    const maxRow = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100').e.r;
    for (let r = startRow + 1; r <= Math.min(maxRow, startRow + limitRows); r++) {
      const t = (sheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v || '') + ' ' + (sheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v || '');
      if (regex.test(this.norm(t))) {
        for (let c = 2; c <= 7; c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r, c })];
          if (cell && (cell.v || cell.w)) return (cell.w || cell.v).toString();
        }
      }
    }
    return '';
  }

  private extractInline(sheet: XLSX.WorkSheet, regex: RegExp): string {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (cell) {
          const match = regex.exec(cell.v || cell.w || '');
          if (match) return match[1];
        }
      }
    }
    return '';
  }

  private findRowThatContains(sheet: XLSX.WorkSheet, patterns: RegExp[]): number | null {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z500');
    for (let r = range.s.r; r <= range.e.r; r++) {
      const windowText: string[] = [];
      for (let wr = 0; wr <= 2; wr++) { // 3-row window
        if (r + wr > range.e.r) break;
        for (let c = range.s.c; c <= Math.min(range.e.c, 40); c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r: r + wr, c })];
          if (!cell) continue;
          const n = this.norm(cell.v || cell.w);
          windowText.push(n);
          if (wr > 0) {
            const prev = sheet[XLSX.utils.encode_cell({ r: r + wr - 1, c })];
            if (prev) windowText.push(this.norm(prev.v || prev.w) + n);
          }
        }
      }
      if (patterns.every(pat => windowText.some(t => pat.test(t)))) {
        console.log(`Matched header window starting at row ${r}`);
        return r;
      }
    }
    return null;
  }

  private scanGroups(sheet: XLSX.WorkSheet, hdrRow: number): { name: string; keys: { [key: string]: number } }[] {
    const groups: { name: string; keys: { [key: string]: number } }[] = [];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
    let i = range.s.c;
    while (i <= range.e.c) {
      const cell = sheet[XLSX.utils.encode_cell({ r: hdrRow, c: i })];
      if (!cell) { i++; continue; }
      const cellText = this.norm(cell.v || cell.w);
      if (this.HEADER_PATTERNS.dischargebh.test(cellText)) {
        console.log(`Found Discharge Borehole group at col ${i}`);
        const map = this.scanSubHeaders(sheet, hdrRow + 1, i, {
          time: this.HEADER_PATTERNS.timemin,
          wl: this.HEADER_PATTERNS.waterlevelm,
          ddn: this.HEADER_PATTERNS.drawdownm,
          q: this.HEADER_PATTERNS.yieldlps
        });
        groups.push({ name: 'discharge', keys: map });
        i += Object.keys(map).length;
      } else if (this.HEADER_PATTERNS.obshole.test(cellText)) {
        const match = cellText.match(this.HEADER_PATTERNS.obshole);
        const holeIndex = match ? match[1] : '1';
        const map = this.scanSubHeaders(sheet, hdrRow + 1, i, {
          time: this.HEADER_PATTERNS.timemin,
          wl: this.HEADER_PATTERNS.waterlevelm,
          ddn: this.HEADER_PATTERNS.drawdownm
        });
        groups.push({ name: `obshole${holeIndex}`, keys: map });
        i += Object.keys(map).length;
      } else if (this.HEADER_PATTERNS.recoverytitle.test(cellText)) {
        const map = this.scanSubHeaders(sheet, hdrRow + 1, i, {
          time: this.HEADER_PATTERNS.timemin,
          wl: this.HEADER_PATTERNS.waterlevelm
        });
        groups.push({ name: 'recovery', keys: map });
        i += Object.keys(map).length;
      } else {
        i++;
      }
    }
    return groups;
  }

  private scanSubHeaders(sheet: XLSX.WorkSheet, subRow: number, startCol: number, expected: { [key: string]: RegExp }): { [key: string]: number } {
    const map: { [key: string]: number } = {};
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
    // Horizontal and vertical lookahead to find all components of the header
    for (let c = startCol; c <= Math.min(startCol + 10, range.e.c); c++) {
      for (let dr = 0; dr <= 2; dr++) { // 3-row vertical window
        const r = subRow + dr;
        if (r > range.e.r) break;
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        const n = this.norm(cell.v || cell.w);

        let nJoined = n;
        if (dr > 0) {
          const prev = sheet[XLSX.utils.encode_cell({ r: r - 1, c })];
          if (prev) nJoined = this.norm(prev.v || prev.w) + n;
        }

        for (const key in expected) {
          if (!map[key] && (expected[key].test(n) || expected[key].test(nJoined))) {
            map[key] = c;
          }
        }
      }
    }
    return map;
  }

  private findDataStartRow(sheet: XLSX.WorkSheet, headerRow: number): number {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z1000');
    for (let r = headerRow + 1; r <= Math.min(headerRow + 10, range.e.r); r++) {
      // Data rows usually start with a number in the first column (e.g., TIME)
      const val = this.toFloat(sheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v);
      if (val !== null) return r;
    }
    return headerRow + 1; // Fallback
  }

  private parseCoordinatesBothIfPresent(sheet: XLSX.WorkSheet): { lat?: number; lon?: number } | null {
    const lat = this.parseCoordinate(this.getNear(sheet, /lat/i));
    const lon = this.parseCoordinate(this.getNear(sheet, /lon/i));
    if (lat || lon) return { lat: lat || undefined, lon: lon || undefined };
    const combo = this.getNear(sheet, /co[- ]?ordinates/i);
    if (combo && combo.includes(',')) {
      const [a, b] = combo.split(',').map(this.parseCoordinate.bind(this));
      return { lat: a || undefined, lon: b || undefined };
    }
    return null;
  }

  private slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
}
