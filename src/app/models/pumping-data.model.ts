// Pumping Data Models for Daily Test Pumping Progress Reporting App

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
  reportDate: Date; // Timestamp in Firestore
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
  createdAt: Date;
  updatedAt: Date;
  fileRef: string; // Path to original .xlsx file
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
  testDate: Date;
  testType: 'Constant' | 'Step';
  dataPoints: AquiferDataPoint[];
  status: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  fileRef: string;
  checks: {
    parseWarnings: string[];
    parseErrors: string[];
  };
}

// New models for discharge reports per PRD - Site-based organization
export interface Site {
  siteId: string; // Slugified siteName
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
  rateIndex?: number; // for discharge_rate
  pageIndex: number; // for chunking
  points: DischargePoint[];
  createdAt: Timestamp;
}

export interface Quality {
  qualityId: string;
  rateIndex: number;
  pH?: number;
  tempC?: number;
  ec_uScm?: number;
  createdAt: Timestamp;
}

export interface DischargeTest {
  testId: string;
  testType: 'stepped_discharge' | 'constant_discharge';
  boreholeRef: string; // path to borehole
  startTime?: Date;
  endTime?: Date;
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

  // View properties
  boreholeId?: string;
  dischargeRate?: number;
  contractor?: string;
  province?: string;
}

export interface ParseJob {
  jobId: string;
  testRef: string; // path to test
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

export interface Employee {
  employeeId: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  hireDate: Timestamp;
  certifications: Certification[];
  status: 'Active' | 'Inactive' | 'Terminated';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Certification {
  certificationId: string;
  employeeId: string;
  name: string;
  issuer: string;
  issueDate: Timestamp;
  expiryDate?: Timestamp;
  status: 'Valid' | 'Expired' | 'Pending';
  documentRef?: string;
}

export interface LeaveRequest {
  leaveId: string;
  employeeId: string;
  type: 'Annual' | 'Sick' | 'Personal' | 'Maternity' | 'Other';
  startDate: Timestamp;
  endDate: Timestamp;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approvedBy?: string;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Vehicle {
  vehicleId: string;
  orgId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  mileage: number;
  lastServiceMileage: number;
  nextServiceMileage: number;
  serviceInterval: number; // miles between services
  status: 'Active' | 'Maintenance' | 'Out of Service';
  location: string;
  assignedTo?: string; // employee ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Rig {
  rigId: string;
  orgId: string;
  name: string;
  type: string; // e.g., 'Drilling Rig', 'Pump Rig'
  engineHours: number;
  lastServiceHours: number;
  nextServiceHours: number;
  serviceInterval: number; // hours between services
  status: 'Active' | 'Standby' | 'Maintenance' | 'Breakdown';
  location: string;
  projectId?: string;
  siteId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MaintenanceSchedule {
  scheduleId: string;
  assetId: string; // vehicleId or rigId
  assetType: 'Vehicle' | 'Rig';
  type: 'Scheduled' | 'Unscheduled';
  description: string;
  dueDate: Timestamp;
  dueMileage?: number; // for vehicles
  dueHours?: number; // for rigs
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  assignedTo?: string;
  completedAt?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InstitutionDataPackage {
  institution: any; // Placeholder, may not be needed
  data: any; // Placeholder
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Material {
  materialId: string;
  orgId: string;
  code: string; // Unique material code
  name: string;
  description: string;
  category: string; // e.g., 'Fuel', 'Chemicals', 'Equipment', 'Consumables'
  subcategory?: string;
  unit: string; // e.g., 'L', 'kg', 'm', 'pcs'
  unitPrice: number;
  minStockLevel: number;
  maxStockLevel?: number;
  currentStock?: number; // Current stock level
  supplier?: string;
  partNumber?: string; // Supplier part number
  specifications?: string; // Additional specs as string
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Requisition {
  requisitionId: string;
  orgId: string;
  title: string; // Requisition title
  description: string; // Requisition description
  projectId: string;
  siteId: string;
  requestedBy: string; // employee ID
  approvedBy?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  type: 'Material' | 'Equipment' | 'Service';
  items: RequisitionItem[];
  totalValue: number;
  requiredDate: Timestamp;
  notes?: string;
  approvalNotes?: string;
  submittedAt?: Timestamp;
  approvedAt?: Timestamp;
  rejectedBy?: string;
  rejectedAt?: Timestamp;
  rejectionReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RequisitionItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  purpose: string;
  notes?: string; // Optional notes for the item
  fulfilledQuantity: number;
  status: 'Pending' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled';
}

export interface InventoryTransaction {
  transactionId: string;
  orgId: string;
  siteId: string;
  materialId: string;
  transactionType: 'Issue' | 'Return' | 'Adjustment'; // More user-friendly than 'type'
  transactionDate: Timestamp; // When the transaction occurred
  quantity: number; // Positive for additions, negative for reductions
  previousStock: number; // Stock level before transaction
  newStock: number; // Stock level after transaction
  reference: string; // requisitionId, purchaseOrderId, etc.
  referenceType: 'Requisition' | 'PurchaseOrder' | 'Adjustment' | 'Transfer';
  performedBy: string; // employee ID
  notes?: string;
  createdAt: Timestamp;
}

export interface PreStartCheckItem {
  section: string;
  question: string;
  response: 'yes' | 'no';
  critical: boolean;
  comments?: string;
}

export interface PreStartCheck {
  checkId: string;
  orgId: string;
  vehicleId: string;
  date: Timestamp;
  shift: 'Morning' | 'Afternoon' | 'Evening';
  checklistItems: PreStartCheckItem[];
  odometerReading: number;
  abnormalFunctions?: string;
  fuelAdded?: string;
  generalComments?: string;
  submittedBy: string;
  status: 'Submitted' | 'Reviewed';
  checkedBySupervisor?: string;
  supervisorName?: string;
  signature?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}