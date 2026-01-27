import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Timestamp } from '@angular/fire/firestore';
import { Report, Shift, Activity, Personnel, ValidationResult, AquiferTest, AquiferDataPoint, Borehole, DischargePoint, Series, Quality, DischargeTest, ParseJob } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExcelParsingService {

  private readonly SHEET_NAME = 'Daily report drilling';

  // Header patterns for discharge parsing
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
   * Parse an Excel workbook file and extract pumping report data with validation
   */
  async parseExcelFile(file: File): Promise<{ data: Report | null; validation: ValidationResult }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          const result = this.extractReportData(workbook);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse an Excel/CSV file for aquifer test data
   */
  async parseAquiferFile(file: File): Promise<{ data: DischargeTest | null; borehole: Borehole | null; series: Series[]; quality: Quality[]; validation: ValidationResult }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          const result = this.extractDischargeData(workbook);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
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

  private extractDischargeData(workbook: XLSX.WorkBook): { data: DischargeTest | null; borehole: Borehole | null; series: Series[]; quality: Quality[]; validation: ValidationResult } {
    const validation: ValidationResult = { isValid: true, errors: [], warnings: [] };

    // Assume first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      validation.isValid = false;
      validation.errors.push('No sheet found in file');
      return { data: null, borehole: null, series: [], quality: [], validation };
    }

    // Detect template type
    const detection = this.detectTemplateType(sheet);
    if (detection.type === 'unknown') {
      validation.isValid = false;
      validation.errors.push('Template not recognized');
      return { data: null, borehole: null, series: [], quality: [], validation };
    }

    let result: any;
    if (detection.type === 'steppeddischarge') {
      result = this.parseSteppedDischarge(sheet, validation);
    } else {
      result = this.parseConstantDischarge(sheet, validation);
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
      coordinates: normalized.meta.latitude && normalized.meta.longitude ? { lat: normalized.meta.latitude, lon: normalized.meta.longitude } : undefined,
      client: normalized.meta.client,
      contractor: normalized.meta.contractor,
      province: normalized.meta.province,
      district: normalized.meta.district,
      elevation_m: normalized.meta.elevationm,
      boreholeDepth_m: normalized.meta.boreholeDepthm,
      datumAboveCasing_m: normalized.meta.datumAboveCasingm,
      existingPump: normalized.meta.existingPump,
      staticWL_mbdl: normalized.meta.staticWLmbdl,
      casingHeight_magl: normalized.meta.casingHeightmagl,
      pumpDepth_m: normalized.meta.pumpDepthm,
      pumpInletDiam_mm: normalized.meta.pumpInletDiammm,
      pumpType: normalized.meta.pumpType,
      swl_mbch: normalized.meta.swlmbch,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const test: DischargeTest = {
      testId: `discharge-${Date.now()}`,
      testType: normalized.testType,
      boreholeRef: `boreholes/${borehole.boreholeId}`,
      startTime: normalized.startISO ? new Date(normalized.startISO) : undefined,
      endTime: normalized.meta.endISO ? new Date(normalized.meta.endISO) : undefined,
      summary: {
        availableDrawdown_m: normalized.meta.availableDrawdownm,
        totalTimePumped_min: normalized.meta.totalTimePumpedmin,
        staticWL_m: normalized.meta.staticWLm || normalized.meta.staticWLmbdl,
        pump: {
          depth_m: normalized.meta.pumpDepthm,
          inletDiam_mm: normalized.meta.pumpInletDiammm,
          type: normalized.meta.pumpType
        },
        notes: normalized.meta.notes
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

    const quality: Quality[] = normalized.quality.map((q: any, idx: number) => ({
      qualityId: `quality-${idx}`,
      rateIndex: q.rateIndex,
      pH: q.pH,
      tempC: q.tempC,
      ec_uScm: q.ec_uScm,
      createdAt: new Date()
    }));

    return { data: test, borehole, series, quality, validation };
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
  private detectTemplateType(sheet: XLSX.WorkSheet): { type: 'steppeddischarge' | 'constantdischarge' | 'unknown' } {
    const hasStepped = this.findCell(sheet, /STEPPED DISCHARGE TEST & RECOVERY/i) != null;
    const hasConstant = this.findCell(sheet, /CONSTANT DISCHARGE AND RECOVERY/i) != null;

    if (hasStepped && !hasConstant) return { type: 'steppeddischarge' };
    if (hasConstant && !hasStepped) return { type: 'constantdischarge' };

    // Fallback heuristics
    if (this.findCell(sheet, /discharge\srate\s1/i)) return { type: 'steppeddischarge' };
    if (this.findCell(sheet, /observation\shole\s*1/i)) return { type: 'constantdischarge' };

    return { type: 'unknown' };
  }

  private parseSteppedDischarge(sheet: XLSX.WorkSheet, validation: ValidationResult): { ok: boolean; data?: any; error?: string } {
    const meta: any = {};
    // Probe for metadata
    meta.projectNo = this.getNear(sheet, /project\sno/i);
    meta.province = this.getNear(sheet, /province/i);
    meta.boreholeNo = this.getNear(sheet, /borehole\sno/i);
    meta.siteName = this.getNear(sheet, /site\sname/i);
    meta.district = this.getNear(sheet, /district/i);
    meta.latitude = this.parseCoordinate(this.getNear(sheet, /latitude/i));
    meta.longitude = this.parseCoordinate(this.getNear(sheet, /longitude/i));
    meta.elevationm = this.toFloat(this.getNear(sheet, /elevation/i));
    meta.boreholeDepthm = this.toFloat(this.getNear(sheet, /borehole\sdepth/i));
    meta.datumAboveCasingm = this.toFloat(this.getNear(sheet, /datum.above\scasing/i));
    meta.existingPump = this.getNear(sheet, /existing\spump/i);
    meta.staticWLmbdl = this.toFloat(this.getNear(sheet, /water\slevel.mbdl/i));
    meta.casingHeightmagl = this.toFloat(this.getNear(sheet, /casing\sheight.magl/i));
    meta.contractor = this.getNear(sheet, /contractor/i);
    meta.pumpDepthm = this.toFloat(this.getNear(sheet, /depth\sof\spump/i));
    meta.pumpInletDiammm = this.toFloat(this.getNear(sheet, /diam(eter)?\spump\sinlet/i));
    meta.pumpType = this.getNear(sheet, /pump\stype/i);
    meta.swlmbch = this.toFloat(this.getNear(sheet, /s\/w\/l.mbch/i));

    let startISO: string | null = null;
    const series: any[] = [];
    const quality: any[] = [];

    // Parse rates 1-6
    for (let rate = 1; rate <= 6; rate++) {
      const titleCell = this.findCell(sheet, new RegExp(`discharge\\srate\\s${rate}`, 'i'));
      if (!titleCell) continue;

      // Extract start time
      const dateVal = this.readNeighbor(sheet, titleCell.row, titleCell.col, /date/i);
      const timeVal = this.readNeighbor(sheet, titleCell.row, titleCell.col, /time/i);
      const rateStartISO = this.excelSerialDateToISO(this.toFloat(dateVal), timeVal);
      if (!startISO && rateStartISO) startISO = rateStartISO;

      const headerRow = this.findHeaderRowBelow(sheet, titleCell.row, [this.HEADER_PATTERNS.timemin, this.HEADER_PATTERNS.waterlevelm]);
      if (!headerRow) continue;

      const headerMap = this.mapHeaders(sheet, headerRow, {
        time: this.HEADER_PATTERNS.timemin,
        wl: this.HEADER_PATTERNS.waterlevelm,
        ddn: this.HEADER_PATTERNS.drawdownm,
        q: this.HEADER_PATTERNS.yieldlps
      });

      const rows = this.readTable(sheet, headerRow + 1, headerRow, headerMap, [this.HEADER_PATTERNS.dischargerate, this.HEADER_PATTERNS.recoverytitle]);
      const pts: DischargePoint[] = [];
      for (const row of rows) {
        const p = this.normalizeUnitsPoint({
          time: row.time,
          wl: row.wl,
          ddn: row.ddn,
          q: row.q
        });
        if (p.t_min != null || p.wl_m != null || p.ddn_m != null || p.qlps != null) {
          pts.push(p);
        }
      }
      if (pts.length > 0) {
        series.push({ seriesType: 'discharge_rate', rateIndex: rate, points: pts });
      }

      // Quality
      const phVal = this.findInlineLabelValueBelow(sheet, headerRow, /pH/i, 10);
      const tempVal = this.findInlineLabelValueBelow(sheet, headerRow, /temp/i, 10);
      const ecVal = this.findInlineLabelValueBelow(sheet, headerRow, /ec/i, 10);
      if (phVal || tempVal || ecVal) {
        quality.push({
          rateIndex: rate,
          pH: this.toFloat(phVal),
          tempC: this.toFloat(tempVal),
          ec_uScm: this.toFloat(ecVal)
        });
      }
    }

    // Recovery
    const recTitle = this.findCell(sheet, this.HEADER_PATTERNS.recoverytitle);
    if (recTitle) {
      const headerRow = this.findHeaderRowBelow(sheet, recTitle.row, [this.HEADER_PATTERNS.timemin]);
      if (headerRow) {
        const headerMap = this.mapHeaders(sheet, headerRow, {
          time: this.HEADER_PATTERNS.timemin,
          wl: this.HEADER_PATTERNS.waterlevelm,
          rec: /^recovery.*m$/i
        });
        const rows = this.readTable(sheet, headerRow + 1, headerRow, headerMap, [this.HEADER_PATTERNS.dischargerate]);
        const pts: DischargePoint[] = [];
        for (const row of rows) {
          const p: DischargePoint = {
            t_min: this.ensureNonNegative(this.toFloat(row.time)),
            wl_m: this.toFloat(row.wl) || undefined,
            recoverym: this.toFloat(row.rec) || undefined
          };
          if (p.t_min != null || p.wl_m != null || p.recoverym != null) {
            pts.push(p);
          }
        }
        if (pts.length > 0) {
          series.push({ seriesType: 'recovery', points: pts });
        }
      }
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

  private parseConstantDischarge(sheet: XLSX.WorkSheet, validation: ValidationResult): { ok: boolean; data?: any; error?: string } {
    const meta: any = {};
    meta.boreholeNo = this.getNear(sheet, /borehole\sno/i);
    meta.siteName = this.getNear(sheet, /site\sname/i);
    meta.client = this.getNear(sheet, /client/i);
    meta.contractor = this.getNear(sheet, /contractor/i);
    const coords = this.parseCoordinatesBothIfPresent(sheet);
    meta.latitude = coords?.lat;
    meta.longitude = coords?.lon;
    meta.boreholeDepthm = this.toFloat(this.getNear(sheet, /borehole\sdepth/i));
    meta.datumAboveCasingm = this.toFloat(this.getNear(sheet, /datum.above\scasing/i));
    meta.existingPump = this.getNear(sheet, /existing\spump/i);
    meta.staticWLm = this.toFloat(this.getNear(sheet, /^water\slevel/i));
    meta.casingHeightm = this.toFloat(this.getNear(sheet, /casing\sheight/i));
    meta.pumpDepthm = this.toFloat(this.getNear(sheet, /depth\sof\spump/i));
    meta.pumpInletDiammm = this.toFloat(this.getNear(sheet, /diam(eter)?\spump\sinlet/i));
    meta.pumpType = this.getNear(sheet, /pump\stype/i);

    const testStartedSerial = this.toFloat(this.getNear(sheet, /test\sstarted/i));
    const startTimeStr = this.getNear(sheet, /^start\stime/i);
    meta.startISO = this.excelSerialDateToISO(testStartedSerial, startTimeStr);
    const testCompletedSerial = this.toFloat(this.getNear(sheet, /test\scompleted/i));
    meta.endISO = this.excelSerialDateToISO(testCompletedSerial);

    meta.availableDrawdownm = this.toFloat(this.extractInline(sheet, /available\sdrawdown\s=\s([0-9.-]+)/i));
    meta.totalTimePumpedmin = this.toFloat(this.getNear(sheet, /total\stime\s*pumped/i));

    const series: any[] = [];

    // Find main header row
    const hdrRow = this.findRowThatContains(sheet, [this.HEADER_PATTERNS.timemin, this.HEADER_PATTERNS.dischargebh]);
    if (!hdrRow) {
      return { ok: false, error: 'Main header row not found' };
    }

    const groups = this.scanGroups(sheet, hdrRow);
    const points: { [key: string]: DischargePoint[] } = {
      discharge: [],
      obshole1: [],
      obshole2: [],
      obshole3: [],
      recovery: []
    };

    const dataStart = hdrRow + 2;
    let r = dataStart;
    let emptyStreak = 0;
    const maxEmptyStreak = 50;

    while (r <= (sheet['!ref'] ? XLSX.utils.decode_range(sheet['!ref']).e.r : 1000) && emptyStreak < maxEmptyStreak) {
      let rowEmpty = true;
      for (const g of groups) {
        const k = g.keys;
        const t = k['time'] ? this.getCellValue(sheet, XLSX.utils.encode_cell({ r: r, c: k['time'] })) : null;
        const wl = k['wl'] ? this.getCellValue(sheet, XLSX.utils.encode_cell({ r: r, c: k['wl'] })) : null;
        const dd = k['ddn'] ? this.getCellValue(sheet, XLSX.utils.encode_cell({ r: r, c: k['ddn'] })) : null;
        const q = k['q'] ? this.getCellValue(sheet, XLSX.utils.encode_cell({ r: r, c: k['q'] })) : null;

        if (t || wl || dd || q) rowEmpty = false;

        let p: DischargePoint;
        if (g.name === 'recovery') {
          p = {
            t_min: this.ensureNonNegative(this.toFloat(t)),
            wl_m: this.toFloat(wl) || undefined
          };
        } else if (g.name.startsWith('obshole')) {
          p = this.normalizeUnitsPoint({ time: t, wl: wl, ddn: dd, q: null });
        } else if (g.name === 'discharge') {
          p = this.normalizeUnitsPoint({ time: t, wl: wl, ddn: dd, q: q });
        } else {
          continue;
        }

        if (p.t_min != null || p.wl_m != null || p.ddn_m != null || p.qlps != null) {
          points[g.name].push(p);
        }
      }
      if (rowEmpty) emptyStreak++;
      else emptyStreak = 0;
      r++;
    }

    // Build series
    if (points['discharge'].length > 0) series.push({ seriesType: 'discharge', points: points['discharge'] });
    for (let idx = 1; idx <= 3; idx++) {
      const name = `obshole${idx}`;
      if (points[name].length > 0) series.push({ seriesType: name, points: points[name] });
    }
    if (points['recovery'].length > 0) series.push({ seriesType: 'recovery', points: points['recovery'] });

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
    return String(s).toLowerCase().trim().replace(/\s+/g, ' ').replace(/°/g, '').replace(/µ/g, 'u').replace(/([m])/g, 'm').replace(/([mm])/g, 'mm').replace(/([min])/g, 'min');
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
    for (let c = range.s.c; c <= Math.min(range.e.c, 25); c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c })];
      if (!cell) continue;
      const n = this.norm(cell.v || cell.w || '');
      for (const key in expectedMap) {
        if (expectedMap[key].test(n) && result[key] == null) {
          result[key] = c;
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

  private excelSerialDateToISO(serial: number | null, timeStr?: string, tzOffsetMinutes = 120): string | null {
    if (serial == null) return null;
    const epoch = new Date('1899-12-30T00:00:00Z');
    const ms = Math.round(serial * 86400000);
    let dt = new Date(epoch.getTime() + ms);
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
    const maxRow = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100').e.r;
    for (let r = startRow + 1; r <= Math.min(maxRow, startRow + 8); r++) {
      const rowText = Object.keys(sheet).filter(k => k.startsWith(XLSX.utils.encode_cell({ r, c: 0 }).replace(/\d+/, ''))).map(c => {
        const cell = sheet[c + r];
        return cell ? this.norm(cell.v || cell.w || '') : '';
      }).join(' | ');
      if (patterns.every(pat => pat.test(rowText))) return r;
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
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
    for (let r = range.s.r; r <= range.e.r; r++) {
      const rowText: string[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        rowText.push(cell ? this.norm(cell.v || cell.w) : '');
      }
      if (patterns.every(pat => rowText.some(t => pat.test(t)))) return r;
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
    for (let c = startCol; c <= startCol + 10; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: subRow, c })];
      if (!cell) continue;
      const n = this.norm(cell.v || cell.w || '');
      for (const key in expected) {
        if (expected[key].test(n) && !map[key]) {
          map[key] = c;
        }
      }
    }
    return map;
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
