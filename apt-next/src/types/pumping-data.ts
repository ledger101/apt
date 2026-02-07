import { Timestamp } from 'firebase/firestore';

export interface Activity {
    order: number;
    activity: string;
    from: string; // HH:mm
    to: string; // HH:mm
    total: string; // H:MM
    chargeable: boolean | null;
}

export interface Personnel {
    name: string;
    hoursWorked: number;
}

export interface Shift {
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    totalHours: number;
    chargeableHours: number;
    activities: Activity[];
    personnel: Personnel[];
}

export interface Report {
    reportId: string;
    orgId: string;
    projectId: string;
    siteId: string;
    rigId: string;
    reportDate: Date | Timestamp;
    client: string;
    projectSiteArea: string;
    rigNumber: string;
    controlBHId?: string;
    obsBH1Id?: string;
    obsBH2Id?: string;
    obsBH3Id?: string;
    challenges: string[];
    supervisorName: string;
    clientRepName: string;
    status: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Archived';
    createdBy: string;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    fileRef: string;
    checks: {
        templateVersion: string;
        parseWarnings: string[];
        parseErrors: string[];
    };
    dayShift: Shift;
    nightShift: Shift;
}

export interface AquiferDataPoint {
    time: number; // in minutes
    waterLevel: number; // in meters
    dischargeRate: number; // in L/s
}

export interface AquiferTest {
    testId: string;
    orgId: string;
    projectId: string;
    siteId: string;
    rigId: string;
    testDate: Date | Timestamp;
    testType: 'Constant' | 'Step';
    dataPoints: AquiferDataPoint[];
    status: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved';
    createdBy: string;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    fileRef: string;
    checks: {
        parseWarnings: string[];
        parseErrors: string[];
    };
}

export interface Site {
    siteId: string;
    siteName: string;
    coordinates?: { lat: number; lon: number };
    client?: string;
    contractor?: string;
    province?: string;
    district?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Borehole {
    boreholeId: string;
    boreholeNo: string;
    altBhNo?: string;
    elevation_m?: number;
    boreholeDepth_m?: number;
    datumAboveCasing_m?: number;
    existingPump?: string;
    staticWL_mbdl?: number;
    casingHeight_magl?: number;
    pumpDepth_m?: number;
    pumpInletDiam_mm?: number;
    pumpType?: string;
    swl_mbch?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface DischargePoint {
    t_min?: number;
    wl_m?: number;
    ddn_m?: number;
    qlps?: number;
    recoverym?: number;
}

export interface Series {
    seriesId: string;
    seriesType:
    | 'discharge_rate'
    | 'recovery'
    | 'discharge'
    | 'discharge_recovery'
    | 'obs_hole_1'
    | 'obs_hole_2'
    | 'obs_hole_3'
    | 'obshole1'
    | 'obshole1_recovery'
    | 'obshole2'
    | 'obshole2_recovery'
    | 'obshole3'
    | 'obshole3_recovery';
    rateIndex?: number;
    pageIndex: number;
    points: DischargePoint[];
    createdAt: Timestamp;
}

export interface Quality {
    qualityId: string;
    rateIndex: number;
    pH?: number;
    tempC?: number;
    ec_uScm?: number;
    createdAt: Timestamp | Date;
}

export interface DischargeTest {
    testId: string;
    testType: 'stepped_discharge' | 'constant_discharge';
    boreholeRef: string;
    startTime?: Date | Timestamp;
    endTime?: Date | Timestamp;
    summary: {
        availableDrawdown_m?: number;
        totalTimePumped_min?: number;
        staticWL_m?: number;
        pump?: {
            depth_m?: number;
            inletDiam_mm?: number;
            type?: string;
        };
        notes?: string;
    };
    sourceFilePath: string;
    status: 'parsed' | 'failed' | 'draft';
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    boreholeId?: string;
    dischargeRate?: number;
    contractor?: string;
    province?: string;
}

export interface ParseJob {
    jobId: string;
    testRef: string;
    status: 'parsed' | 'failed';
    warnings: string[];
    counts: {
        series: number;
        points: number;
    };
    sourceFilePath: string;
    createdBy: string;
    createdAt: Timestamp;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
