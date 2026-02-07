import * as XLSX from 'xlsx';
import { Timestamp } from 'firebase/firestore';
import {
    Report,
    Shift,
    Activity,
    Personnel,
    ValidationResult,
    DischargePoint,
    Site,
    Borehole,
    Series,
    Quality,
    DischargeTest
} from '@/types';

export class ExcelParser {
    private readonly SHEET_NAME = 'Daily report drilling';

    // Cell reference mappings for Stepped Discharge Test Template
    private readonly STEPPED_DISCHARGE_CELLS = {
        metadata: {
            projectNo: 'C5',
            boreholeNo: 'C6',
            altBhNo: 'C7',
            boreholeDepthm: 'C9',
            staticWLmbdl: 'C10',
            pumpDepthm: 'C11',
            mapRef: 'H5',
            latitude: 'H6',
            longitude: 'H7',
            elevationm: 'H8',
            datumAboveCasingm: 'H9',
            casingHeightmagl: 'H10',
            pumpInletDiammm: 'H11',
            province: 'M5',
            district: 'M6',
            siteName: 'M7',
            existingPump: 'M9',
            contractor: 'M10',
            pumpType: 'M11',
            client: 'I11',
            swlmbch: 'C13'
        },
        rates: [
            {
                rateIndex: 1,
                titleRow: 13,
                date: 'C14',
                time: 'F14',
                dataStartRow: 17,
                dataEndRow: 40,
                timeCol: 'A',
                wlCol: 'B',
                ddnCol: 'C',
                qCol: 'D',
                phRow: 41, phCol: 'C',
                tempRow: 41, tempCol: 'D',
                ecRow: 42, ecCol: 'D'
            },
            {
                rateIndex: 2,
                titleRow: 13,
                date: 'H14',
                time: 'J14',
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

    private readonly CONSTANT_DISCHARGE_CELLS = {
        metadata: {
            boreholeNo: 'C3',
            siteName: 'P4',
            client: 'P5',
            contractor: 'P3',
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
            testDate: 'B11',
            startTime: 'E11',
            testCompleted: 'G11',
            testCompletedTime: 'L11'
        },
        discharge: {
            dataStartRow: 16,
            dataEndRow: 150,
            timeCol: 'A',
            wlCol: 'B',
            ddnCol: 'C',
            qCol: 'D'
        },
        dischargeRecovery: {
            dataStartRow: 16,
            dataEndRow: 150,
            timeCol: 'E',
            wlCol: 'F'
        },
        obshole1: {
            dataStartRow: 16,
            dataEndRow: 150,
            timeCol: 'G',
            wlCol: 'H',
            ddnCol: 'I',
            recoveryCol: 'J'
        },
        obshole2: {
            dataStartRow: 16,
            dataEndRow: 150,
            timeCol: 'K',
            wlCol: 'L',
            ddnCol: 'M',
            recoveryCol: 'N'
        },
        obshole3: {
            dataStartRow: 16,
            dataEndRow: 150,
            timeCol: 'O',
            wlCol: 'P',
            ddnCol: 'Q',
            recoveryCol: 'R'
        }
    };

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

    /**
     * Main entry point for parsing any supported Excel file
     */
    async parseFile(file: File): Promise<{
        type: 'progress_report' | 'stepped_discharge' | 'constant_discharge' | 'unknown';
        data: Report | DischargeTest | null;
        site: Site | null;
        borehole: Borehole | null;
        series: Series[];
        quality: Quality[];
        validation: ValidationResult;
    }> {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const type = this.detectTemplateType(workbook);
        const validation: ValidationResult = { isValid: true, errors: [], warnings: [] };

        if (type === 'progress_report') {
            const result = this.extractReportData(workbook);
            return {
                type,
                data: result.data,
                site: null,
                borehole: null,
                series: [],
                quality: [],
                validation: result.validation
            };
        } else if (type === 'stepped_discharge' || type === 'constant_discharge') {
            const result = this.extractDischargeData(workbook, file.name);
            return {
                type,
                data: result.data,
                site: result.site,
                borehole: result.borehole,
                series: result.series,
                quality: result.quality,
                validation: result.validation
            };
        } else {
            validation.isValid = false;
            validation.errors.push('Template type not recognized. Please use a supported Excel template.');
            return {
                type: 'unknown',
                data: null,
                site: null,
                borehole: null,
                series: [],
                quality: [],
                validation
            };
        }
    }

    private detectTemplateType(workbook: XLSX.WorkBook): 'progress_report' | 'stepped_discharge' | 'constant_discharge' | 'unknown' {
        if (workbook.Sheets[this.SHEET_NAME]) {
            return 'progress_report';
        }

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) continue;

            const hasStepped = this.findCell(sheet, /STEPPED DISCHARGE TEST & RECOVERY/i) != null;
            if (hasStepped) return 'stepped_discharge';

            const hasConstant = this.findCell(sheet, /CONSTANT DISCHARGE AND RECOVERY/i) != null;
            if (hasConstant) return 'constant_discharge';

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

    private extractReportData(workbook: XLSX.WorkBook): { data: Report | null; validation: ValidationResult } {
        const validation: ValidationResult = { isValid: true, errors: [], warnings: [] };
        const sheet = workbook.Sheets[this.SHEET_NAME];

        if (!sheet) {
            validation.isValid = false;
            validation.errors.push('Sheet "Daily report drilling" not found');
            return { data: null, validation };
        }

        const reportDateStr = this.getCellValue(sheet, 'I6');
        const client = this.getCellValue(sheet, 'D7');
        const projectSiteArea = this.getCellValue(sheet, 'E9');
        const rigNumber = this.extractRigNumber(sheet);
        const controlBHId = this.getCellValue(sheet, 'D10');
        const obsBH1Id = this.getCellValue(sheet, 'F10');
        const obsBH2Id = this.getCellValue(sheet, 'H10');
        const obsBH3Id = this.getCellValue(sheet, 'J10');
        const challenges = this.extractChallenges(sheet);
        const supervisorName = this.getCellValue(sheet, 'B32');
        const clientRepName = this.getCellValue(sheet, 'B33');

        if (!reportDateStr) validation.errors.push('Report Date is required');
        if (!client) validation.errors.push('Client is required');
        if (!projectSiteArea) validation.errors.push('Project/Site Area is required');
        if (!rigNumber) validation.errors.push('Rig Number is required');

        const dayShift = this.extractShift(sheet, 'Day', 13, 22, 'H9', 'J9');
        const nightShift = this.extractShift(sheet, 'Night', 34, 43, 'F31', 'I31');

        dayShift.personnel = this.extractPersonnel(sheet, 25, 29);
        nightShift.personnel = this.extractPersonnel(sheet, 46, 50);

        if (validation.errors.length > 0) validation.isValid = false;

        const reportDate = reportDateStr ? new Date(reportDateStr) : new Date();

        const report: Report = {
            reportId: `${reportDateStr}-${projectSiteArea}-${rigNumber}`.replace(/\s+/g, ''),
            orgId: 'default-org',
            projectId: 'default-project',
            siteId: 'default-site',
            rigId: 'default-rig',
            reportDate,
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
            createdBy: 'user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
            fileRef: '',
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

    private extractDischargeData(workbook: XLSX.WorkBook, filename?: string): {
        data: DischargeTest | null;
        site: Site | null;
        borehole: Borehole | null;
        series: Series[];
        quality: Quality[];
        validation: ValidationResult
    } {
        const validation: ValidationResult = { isValid: true, errors: [], warnings: [] };
        let type: 'stepped_discharge' | 'constant_discharge' | 'unknown' = 'unknown';
        let sheet: XLSX.WorkSheet | null = null;

        for (const name of workbook.SheetNames) {
            const s = workbook.Sheets[name];
            if (!s) continue;
            const hasStepped = this.findCell(s, /STEPPED DISCHARGE TEST & RECOVERY/i) != null;
            const hasConstant = this.findCell(s, /CONSTANT DISCHARGE AND RECOVERY/i) != null;

            if (hasStepped) { type = 'stepped_discharge'; sheet = s; break; }
            if (hasConstant) { type = 'constant_discharge'; sheet = s; break; }

            const content = JSON.stringify(XLSX.utils.sheet_to_json(s, { header: 1, range: 0 })).toLowerCase();
            if (content.includes('discharge rate 1') || content.includes('stepped discharge')) {
                type = 'stepped_discharge'; sheet = s; break;
            }
            if (content.includes('observation hole 1') || content.includes('constant discharge')) {
                type = 'constant_discharge'; sheet = s; break;
            }
        }

        if (type === 'unknown' || !sheet) {
            validation.isValid = false;
            validation.errors.push('Template not recognized in any sheet');
            return { data: null, site: null, borehole: null, series: [], quality: [], validation };
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
            return { data: null, site: null, borehole: null, series: [], quality: [], validation };
        }

        const normalized = this.normalizeCommon(result.data, validation);
        const siteId = this.slugify(normalized.meta.siteName || 'unknown-site');

        const site: Site = {
            siteId,
            siteName: normalized.meta.siteName || '',
            coordinates: (normalized.meta.latitude && normalized.meta.longitude)
                ? { lat: normalized.meta.latitude, lon: normalized.meta.longitude }
                : undefined,
            client: normalized.meta.client ?? undefined,
            contractor: normalized.meta.contractor ?? undefined,
            province: normalized.meta.province ?? undefined,
            district: normalized.meta.district ?? undefined,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const boreholeId = this.slugify(normalized.meta.boreholeNo || 'unknown');
        const borehole: Borehole = {
            boreholeId,
            boreholeNo: normalized.meta.boreholeNo || '',
            altBhNo: normalized.meta.altBhNo ?? undefined,
            elevation_m: normalized.meta.elevationm ?? undefined,
            boreholeDepth_m: normalized.meta.boreholeDepthm ?? undefined,
            datumAboveCasing_m: normalized.meta.datumAboveCasingm ?? undefined,
            existingPump: normalized.meta.existingPump ?? undefined,
            staticWL_mbdl: normalized.meta.staticWLmbdl ?? undefined,
            casingHeight_magl: normalized.meta.casingHeightmagl ?? undefined,
            pumpDepth_m: normalized.meta.pumpDepthm ?? undefined,
            pumpInletDiam_mm: normalized.meta.pumpInletDiammm ?? undefined,
            pumpType: normalized.meta.pumpType ?? undefined,
            swl_mbch: normalized.meta.swlmbch ?? undefined,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const test: DischargeTest = {
            testId: `discharge-${Date.now()}`,
            testType: normalized.testType,
            boreholeRef: `sites/${siteId}/boreholes/${borehole.boreholeId}`,
            startTime: normalized.startISO ? new Date(normalized.startISO) : undefined,
            endTime: normalized.meta.endISO ? new Date(normalized.meta.endISO) : undefined,
            summary: {
                availableDrawdown_m: normalized.meta.availableDrawdownm ?? undefined,
                totalTimePumped_min: normalized.meta.totalTimePumpedmin ?? undefined,
                staticWL_m: (normalized.meta.staticWLm || normalized.meta.staticWLmbdl) ?? undefined,
                pump: {
                    depth_m: normalized.meta.pumpDepthm ?? undefined,
                    inletDiam_mm: normalized.meta.pumpInletDiammm ?? undefined,
                    type: normalized.meta.pumpType ?? undefined
                },
                notes: normalized.meta.notes ?? undefined
            },
            sourceFilePath: '',
            status: 'draft',
            createdBy: 'user-id',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const series: Series[] = [];
        let seriesIndex = 0;
        for (const s of normalized.series) {
            const chunkSize = 400;
            for (let i = 0; i < s.points.length; i += chunkSize) {
                series.push({
                    seriesId: `${s.seriesType}-${seriesIndex++}`,
                    seriesType: s.seriesType,
                    rateIndex: s.rateIndex,
                    pageIndex: i / chunkSize,
                    points: s.points.slice(i, i + chunkSize),
                    createdAt: Timestamp.now()
                });
            }
        }

        const quality: Quality[] = (normalized.quality || []).map((q: any, idx: number) => ({
            qualityId: `quality-${idx}`,
            rateIndex: q.rateIndex,
            pH: q.pH,
            tempC: q.tempC,
            ec_uScm: q.ec_uScm,
            createdAt: new Date()
        }));

        return { data: test, site, borehole, series, quality, validation };
    }

    private parseSteppedDischarge(sheet: XLSX.WorkSheet, validation: ValidationResult, filename?: string): any {
        const meta: any = {};
        const cellMap = this.STEPPED_DISCHARGE_CELLS.metadata;

        meta.projectNo = this.getCellByRef(sheet, cellMap.projectNo);
        meta.mapRef = this.getCellByRef(sheet, cellMap.mapRef);
        meta.province = this.getCellByRef(sheet, cellMap.province);
        meta.boreholeNo = this.getCellByRef(sheet, cellMap.boreholeNo);
        meta.altBhNo = this.getCellByRef(sheet, cellMap.altBhNo);
        meta.siteName = this.getCellByRef(sheet, cellMap.siteName);
        meta.district = this.getCellByRef(sheet, cellMap.district);

        meta.latitude = this.parseCoordinate(this.getCellByRef(sheet, cellMap.latitude));
        meta.longitude = this.parseCoordinate(this.getCellByRef(sheet, cellMap.longitude));

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

        if (!meta.boreholeNo && !meta.siteName) {
            const fallback = filename ? filename.split('.')[0] : 'Unknown-Borehole';
            meta.boreholeNo = fallback;
            validation.warnings.push(`Borehole No/Site Name not found. Using "${fallback}".`);
        }

        let startISO: string | null = null;
        const series: any[] = [];
        const quality: any[] = [];

        for (const rateConfig of this.STEPPED_DISCHARGE_CELLS.rates) {
            const rateStartISO = this.parseExcelDateTime(this.getCellByRef(sheet, rateConfig.date), this.getCellByRef(sheet, rateConfig.time));
            if (!startISO && rateStartISO) startISO = rateStartISO;

            const rawData = this.extractDataRange(sheet, rateConfig.dataStartRow, rateConfig.dataEndRow, {
                time: rateConfig.timeCol, wl: rateConfig.wlCol, ddn: rateConfig.ddnCol, q: rateConfig.qCol
            });

            const points = rawData.map(row => ({
                t_min: this.ensureNonNegative(this.toFloat(row.time)),
                wl_m: this.toFloat(row.wl),
                ddn_m: this.toFloat(row.ddn),
                qlps: this.toFloat(row.q)
            })).filter(p => p.t_min != null || p.wl_m != null);

            if (points.length > 0) {
                series.push({ seriesType: 'discharge_rate', rateIndex: rateConfig.rateIndex, points });
            }

            const phVal = this.toFloat(this.getCellByRef(sheet, `${rateConfig.phCol}${rateConfig.phRow}`));
            const tempVal = this.toFloat(this.getCellByRef(sheet, `${rateConfig.tempCol}${rateConfig.tempRow}`));
            const ecVal = this.toFloat(this.getCellByRef(sheet, `${rateConfig.ecCol}${rateConfig.ecRow}`));

            if (phVal != null || tempVal != null || ecVal != null) {
                quality.push({ rateIndex: rateConfig.rateIndex, pH: phVal, tempC: tempVal, ec_uScm: ecVal });
            }
        }

        const recoveryRaw = this.extractDataRange(sheet, this.STEPPED_DISCHARGE_CELLS.recovery.dataStartRow, this.STEPPED_DISCHARGE_CELLS.recovery.dataEndRow, {
            time: this.STEPPED_DISCHARGE_CELLS.recovery.timeCol,
            wl: this.STEPPED_DISCHARGE_CELLS.recovery.wlCol,
            recovery: this.STEPPED_DISCHARGE_CELLS.recovery.recoveryCol
        });

        const recoveryPoints = recoveryRaw.map(row => ({
            t_min: this.ensureNonNegative(this.toFloat(row.time)),
            wl_m: this.toFloat(row.wl),
            recoverym: this.toFloat(row.recovery)
        })).filter(p => p.t_min != null || p.wl_m != null);

        if (recoveryPoints.length > 0) series.push({ seriesType: 'recovery', points: recoveryPoints });

        return { ok: true, data: { testType: 'stepped_discharge', meta, startISO, series, quality } };
    }

    private parseConstantDischarge(sheet: XLSX.WorkSheet, validation: ValidationResult, filename?: string): any {
        const meta: any = {};
        const cellMap = this.CONSTANT_DISCHARGE_CELLS.metadata;

        meta.boreholeNo = this.getCellByRef(sheet, cellMap.boreholeNo);
        meta.siteName = this.getCellByRef(sheet, cellMap.siteName);
        meta.client = this.getCellByRef(sheet, cellMap.client);
        meta.contractor = this.getCellByRef(sheet, cellMap.contractor);
        meta.altBhNo = this.getCellByRef(sheet, cellMap.altBhNo);

        meta.latitude = this.parseCoordinate(this.getCellByRef(sheet, cellMap.latitude));
        meta.longitude = this.parseCoordinate(this.getCellByRef(sheet, cellMap.longitude));

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

        meta.startISO = this.parseExcelDateTime(this.getCellByRef(sheet, cellMap.testDate), this.getCellByRef(sheet, cellMap.startTime));
        meta.endISO = this.parseExcelDateTime(this.getCellByRef(sheet, cellMap.testCompleted), this.getCellByRef(sheet, cellMap.testCompletedTime));

        if (!meta.boreholeNo && !meta.siteName) {
            const fallback = filename ? filename.split('.')[0] : 'Unknown-Borehole';
            meta.boreholeNo = fallback;
            validation.warnings.push(`Borehole No/Site Name not found. Using "${fallback}".`);
        }

        const series: any[] = [];

        // Helper for repetitive extraction
        const extract = (config: any, type: string, cols: any, checkKeys: string[] = ['wl_m']) => {
            const pts: any[] = [];
            for (let r = config.dataStartRow; r <= config.dataEndRow; r++) {
                const point: any = { t_min: this.toFloat(this.getRawCellValue(sheet, `${config.timeCol}${r}`)) };
                Object.entries(cols).forEach(([k, c]: [string, any]) => point[k] = this.toFloat(this.getRawCellValue(sheet, `${c}${r}`)));
                if (point.t_min != null || checkKeys.some(k => (point as any)[k] != null)) pts.push(point);
            }
            if (pts.length > 0 && pts.some(p => checkKeys.some(k => p[k] != null))) series.push({ seriesType: type, points: pts });
        };

        extract(this.CONSTANT_DISCHARGE_CELLS.discharge, 'discharge', { wl_m: 'B', ddn_m: 'C', qlps: 'D' }, ['wl_m', 'ddn_m', 'qlps']);
        extract(this.CONSTANT_DISCHARGE_CELLS.dischargeRecovery, 'discharge_recovery', { wl_m: 'F' });
        extract(this.CONSTANT_DISCHARGE_CELLS.obshole1, 'obshole1', { wl_m: 'H', ddn_m: 'I' });
        extract(this.CONSTANT_DISCHARGE_CELLS.obshole2, 'obshole2', { wl_m: 'L', ddn_m: 'M' });
        extract(this.CONSTANT_DISCHARGE_CELLS.obshole3, 'obshole3', { wl_m: 'P', ddn_m: 'Q' });

        return { ok: true, data: { testType: 'constant_discharge', meta, startISO: meta.startISO, series } };
    }

    // Utilities
    private getCellValue(sheet: XLSX.WorkSheet, cell: string): string {
        const c = sheet[cell];
        return (c?.w ?? c?.v ?? '').toString().trim();
    }

    private getCellByRef(sheet: XLSX.WorkSheet, cellRef: string): any {
        const cell = sheet[cellRef];
        return cell ? (cell.v ?? cell.w ?? null) : null;
    }

    private getRawCellValue(sheet: XLSX.WorkSheet, cellRef: string): any {
        return sheet[cellRef]?.v ?? null;
    }

    private extractRigNumber(sheet: XLSX.WorkSheet): string {
        const label = this.getCellValue(sheet, 'A9');
        return label.includes('RIG No') ? label.replace('RIG No_', '').trim() : label;
    }

    private extractChallenges(sheet: XLSX.WorkSheet): string[] {
        const res = [];
        for (let i = 52; i <= 55; i++) {
            const val = this.getCellValue(sheet, `B${i}`);
            if (val) res.push(val);
        }
        return res;
    }

    private extractShift(sheet: XLSX.WorkSheet, label: string, startRow: number, endRow: number, startTimeCell: string, endTimeCell: string): Shift {
        const startTime = this.parseTime(this.getCellValue(sheet, startTimeCell));
        const endTime = this.parseTime(this.getCellValue(sheet, endTimeCell));
        const activities: Activity[] = [];

        for (let row = startRow; row <= endRow; row++) {
            const activity = this.getCellValue(sheet, `B${row}`);
            const from = this.getCellValue(sheet, `F${row}`);
            const to = this.getCellValue(sheet, `G${row}`);
            if (activity || from || to) {
                activities.push({
                    order: row - startRow + 1,
                    activity, from, to,
                    total: this.calculateActivityDuration(from, to),
                    chargeable: this.getCellValue(sheet, `I${row}`) !== ''
                });
            }
        }

        const totalHours = activities.reduce((sum, a) => sum + this.parseDuration(a.total), 0);
        const chargeableHours = activities.filter(a => a.chargeable).reduce((sum, a) => sum + this.parseDuration(a.total), 0);

        return { startTime, endTime, totalHours, chargeableHours, activities, personnel: [] };
    }

    private extractPersonnel(sheet: XLSX.WorkSheet, startRow: number, endRow: number): Personnel[] {
        const res = [];
        for (let row = startRow; row <= endRow; row++) {
            const n1 = this.getCellValue(sheet, `B${row}`);
            const h1 = parseFloat(this.getCellValue(sheet, `F${row}`)) || 0;
            if (n1) res.push({ name: n1, hoursWorked: h1 });
            const n2 = this.getCellValue(sheet, `G${row}`);
            const h2 = parseFloat(this.getCellValue(sheet, `J${row}`)) || 0;
            if (n2) res.push({ name: n2, hoursWorked: h2 });
        }
        return res;
    }

    private calculateActivityDuration(from: string, to: string): string {
        if (!from || !to) return '';
        const fp = this.parseTime(from).split(':').map(Number);
        const tp = this.parseTime(to).split(':').map(Number);
        if (isNaN(fp[0]) || isNaN(tp[0])) return '';
        let diff = (tp[0] * 60 + tp[1]) - (fp[0] * 60 + fp[1]);
        if (diff < 0) diff += 1440;
        return `${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`;
    }

    private parseTime(t: string): string {
        if (!t) return '';
        const d = new Date(t);
        if (!isNaN(d.getTime())) return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        const m = t.match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
        if (m) {
            let h = parseInt(m[1]);
            if (m[4].toUpperCase() === 'PM' && h !== 12) h += 12;
            else if (m[4].toUpperCase() === 'AM' && h === 12) h = 0;
            return `${h.toString().padStart(2, '0')}:${m[2].toString().padStart(2, '0')}`;
        }
        return t;
    }

    private parseDuration(d: string): number {
        const p = d.split(':');
        return p.length === 2 ? parseInt(p[0]) + parseInt(p[1]) / 60 : 0;
    }

    private toFloat(v: any): number | null {
        if (v == null || v === '') return null;
        const n = parseFloat(String(v).replace(/,/g, '').trim());
        return isNaN(n) ? null : n;
    }

    private ensureNonNegative(n: number | null): number | undefined {
        return n == null ? undefined : Math.max(0, n);
    }

    private parseCoordinate(v: any): number | null {
        if (!v) return null;
        const s = String(v).split(',')[0].trim();
        return this.toFloat(s);
    }

    private extractDataRange(sheet: XLSX.WorkSheet, start: number, end: number, cols: any): any[] {
        const res = [];
        for (let r = start; r <= end; r++) {
            const row: any = {};
            let has = false;
            Object.entries(cols).forEach(([k, c]: [string, any]) => {
                row[k] = this.getCellByRef(sheet, `${c}${r}`);
                if (row[k] != null) has = true;
            });
            if (has) res.push(row);
        }
        return res;
    }

    private parseExcelDateTime(dateVal: any, timeVal?: any): string | null {
        if (dateVal == null) return null;
        if (typeof dateVal === 'number') return this.excelSerialDateToISO(dateVal, timeVal);
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return null;
        if (timeVal && String(timeVal).includes(':')) {
            const [h, m] = String(timeVal).split(':').map(Number);
            d.setHours(h || 0, m || 0);
        }
        return d.toISOString();
    }

    private excelSerialDateToISO(serial: number, timeVal?: any): string | null {
        const epoch = new Date('1899-12-30T00:00:00Z');
        const timeNum = typeof timeVal === 'number' ? timeVal : 0;
        const total = Math.floor(serial) + (timeNum > 0 ? timeNum : (serial - Math.floor(serial)));
        const dt = new Date(epoch.getTime() + Math.round(total * 86400000));
        return dt.toISOString();
    }

    private findCell(sheet: XLSX.WorkSheet, regex: RegExp): { r: number, c: number } | null {
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
        for (let r = range.s.r; r <= Math.min(range.e.r, 100); r++) {
            for (let c = range.s.c; c <= Math.min(range.e.c, 25); c++) {
                const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                if (cell && regex.test(String(cell.v || cell.w).toLowerCase())) return { r, c };
            }
        }
        return null;
    }

    private normalizeCommon(parsed: any, validation: ValidationResult): any {
        if (!parsed.meta.boreholeNo && !parsed.meta.siteName) validation.errors.push('Missing borehole/site');
        return parsed;
    }

    private slugify(s: string): string {
        return s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
}
