# Current Architecture Analysis

## Document Overview

**Analysis Date:** February 1, 2026  
**Application:** Daily Test Pumping Progress Reporting App  
**Current Version:** Angular 20.0.4  
**Backend:** Firebase (Firestore, Auth, Storage, Functions)

---

## 1. Technology Stack

### Frontend
| Technology | Version | Purpose |
|-------------|----------|---------|
| Angular | 20.0.4 | Main SPA framework |
| TypeScript | 5.8.2 | Type-safe development |
| Tailwind CSS | 3.4.7 | Utility-first styling |
| Angular CDK | 20.2.7 | Component development kit |
| Chart.js | 4.5.1 | Data visualization |
| AG Grid | 34.2.0 | Data grids |
| SweetAlert2 | 11.26.17 | Alert dialogs |
| jsPDF | 3.0.3 | PDF generation |
| XLSX | 0.18.5 | Excel parsing |

### Backend
| Service | Purpose |
|----------|---------|
| Firestore | NoSQL database for structured data |
| Firebase Auth | Authentication (OIDC with Microsoft Entra ID) |
| Cloud Storage | File storage for Excel uploads |
| Cloud Functions | Server-side logic (planned) |

---

## 2. Application Structure

### Module Organization

```
src/app/
├── components/           # Shared UI components
│   ├── alert/           # Alert notifications
│   ├── empty-state/     # Empty state displays
│   ├── navbar/          # Navigation bar
│   ├── reports/         # Report components
│   ├── spinner/         # Loading indicators
│   └── upload/         # File upload component
├── guards/              # Route guards
│   └── auth.guard.ts    # Authentication guard
├── interceptors/        # HTTP interceptors
│   ├── error.interceptor.ts
│   └── loading.interceptor.ts
├── models/              # Data models
│   ├── pumping-data.model.ts
│   └── index.ts
├── modules/             # Feature modules
│   ├── financial/        # Financial management
│   │   ├── invoices/
│   │   ├── invoice-config/
│   │   ├── income-expense/
│   │   └── requisitions/
│   ├── fleet/           # Fleet management
│   │   ├── asset-register/
│   │   ├── logistics/
│   │   ├── maintenance-alerts/
│   │   └── pre-start-check/
│   ├── ohs/             # Occupational Health & Safety
│   ├── operations/       # Operations module
│   ├── personnel/        # Personnel management
│   │   ├── leave-tracking/
│   │   ├── onboarding/
│   │   └── personnel-home/
│   └── supply-chain/    # Supply chain management
│       ├── material-master/
│       └── requisition-workflow/
├── pages/               # Page-level components
│   ├── dashboard/
│   └── login/
├── services/            # Business logic & API calls
│   ├── auth.service.ts
│   ├── excel-parsing.service.ts
│   ├── firestore.service.ts
│   ├── fleet.service.ts
│   └── invoice-config.service.ts
├── app.config.ts        # App configuration
├── app.routes.ts        # Route definitions
├── app.ts              # Root component
└── styles.scss          # Global styles
```

---

## 3. Key Business Logic

### 3.1 Excel Parsing Service

**File:** [`src/app/services/excel-parsing.service.ts`](../src/app/services/excel-parsing.service.ts)

**Responsibilities:**
- Parse Excel templates (`.xlsx` files)
- Detect template type (Progress Report, Stepped Discharge, Constant Discharge)
- Extract structured data from specific cell references
- Validate data integrity
- Map Excel data to TypeScript models

**Template Types Supported:**
1. **Daily Test Pumping Progress Report**
   - Sheet: "Daily report drilling"
   - Fields: Date, Client, Project/Site Area, Rig No, Shifts, Activities, Personnel, Challenges
   - Cell mappings: Precise cell references (e.g., I6 → reportDate, D7 → client)

2. **Stepped Discharge Test**
   - Metadata: Project No, Borehole No, Coordinates, Pump details
   - Multiple discharge rates with time series data
   - Quality parameters (pH, temp, EC)

3. **Constant Discharge Test**
   - Discharge borehole data
   - Multiple observation holes (up to 3)
   - Recovery data

**Key Methods:**
```typescript
parseFile(file: File): Promise<{
  type: 'progress_report' | 'stepped_discharge' | 'constant_discharge' | 'unknown';
  data: Report | DischargeTest | null;
  site: Site | null;
  borehole: Borehole | null;
  series: Series[];
  quality: Quality[];
  validation: ValidationResult;
}>
```

**Migration Hotspot:** ⚠️ **HIGH RISK**
- Complex cell reference mappings must be preserved exactly
- Template detection logic is fragile
- Validation rules are business-critical

---

### 3.2 Firestore Service

**File:** [`src/app/services/firestore.service.ts`](../src/app/services/firestore.service.ts)

**Responsibilities:**
- CRUD operations for all data models
- Timestamp handling (Date ↔ Timestamp conversion)
- Data cleaning (removing undefined values)
- Query operations with filters and ordering

**Data Models Managed:**
1. **Reports** - Daily pumping progress reports
2. **Aquifer Tests** - Aquifer test data
3. **Sites** - Site information
4. **Boreholes** - Borehole data under sites
5. **Discharge Tests** - Discharge test metadata
6. **Series** - Time series data (chunked at 400 points)
7. **Quality** - Water quality measurements
8. **Materials** - Material master data
9. **Requisitions** - Material requisitions
10. **Inventory Transactions** - Stock movements
11. **Pre-start Checks** - Vehicle/equipment checks
12. **Invoices** - Invoice data
13. **Invoice Config** - Invoice configuration

**Key Methods:**
```typescript
// Reports
saveReport(report: Report): Promise<void>
getReports(): Promise<Report[]>
getReport(reportId: string): Promise<Report | null>

// Sites & Boreholes
saveSite(site: Site): Promise<void>
saveBorehole(siteId: string, borehole: Borehole): Promise<void>
saveBoreholeData(site: Site, borehole: Borehole, test: DischargeTest): Promise<void>

// Series & Quality
saveSeriesData(siteId: string, boreholeNo: string, seriesList: Series[]): Promise<void>
saveQualityData(siteId: string, boreholeNo: string, qualityList: Quality[]): Promise<void>

// Queries
getDischargeTests(): Promise<DischargeTest[]>
getTestsBySite(siteId: string): Promise<DischargeTest[]>
getBoreholesBySite(siteId: string): Promise<Borehole[]>
```

**Migration Hotspot:** ⚠️ **MEDIUM RISK**
- Firestore SDK differences between Angular and Next.js
- Timestamp handling must be consistent
- Complex nested document structure

---

### 3.3 Authentication Service

**File:** [`src/app/services/auth.service.ts`](../src/app/services/auth.service.ts)

**Responsibilities:**
- Firebase Authentication integration
- OIDC with Microsoft Entra ID
- User session management
- Role-based access control (RBAC)

**User Roles:**
- **Site Manager (SM):** Upload reports, view own submissions
- **Office Manager (OM):** View all reports, approve/reject
- **Administrator (Admin):** Manage users, sites, rigs, configuration

**Migration Hotspot:** ⚠️ **HIGH RISK**
- Authentication flow must work seamlessly in Next.js
- Session persistence across SSR/client boundary
- Role-based route protection

---

## 4. Data Models

### 4.1 Core Models

**File:** [`src/app/models/pumping-data.model.ts`](../src/app/models/pumping-data.model.ts)

**Key Interfaces:**

```typescript
// Daily Progress Report
interface Report {
  reportId: string;
  orgId: string;
  projectId: string;
  siteId: string;
  rigId: string;
  reportDate: Date;
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
  fileRef: string;
  checks: {
    templateVersion: string;
    parseWarnings: string[];
    parseErrors: string[];
  };
  dayShift: Shift;
  nightShift: Shift;
}

interface Shift {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  totalHours: number;
  chargeableHours: number;
  activities: Activity[];
  personnel: Personnel[];
}

interface Activity {
  order: number;
  activity: string;
  from: string; // HH:mm
  to: string; // HH:mm
  total: string; // H:MM
  chargeable: boolean | null;
}

interface Personnel {
  name: string;
  hoursWorked: number;
}

// Discharge Test Data
interface DischargeTest {
  testId: string;
  testType: 'stepped_discharge' | 'constant_discharge';
  boreholeRef: string;
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
}

interface Series {
  seriesId: string;
  seriesType: 'discharge_rate' | 'recovery' | 'discharge' | 'obs_hole_1' | 'obs_hole_2' | 'obs_hole_3';
  rateIndex?: number;
  pageIndex: number; // for chunking
  points: DischargePoint[];
  createdAt: Timestamp;
}

interface DischargePoint {
  t_min?: number;
  wl_m?: number;
  ddn_m?: number;
  qlps?: number;
  recoverym?: number;
}

// Financial Models
interface Invoice {
  invoiceId: string;
  reportId: string;
  orgId: string;
  projectId: string;
  siteId: string;
  client: string;
  projectSiteArea: string;
  reportDate: Date;
  rigNumber: string;
  invoiceNumber: string;
  invoiceDate: Date;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  chargeRate: number;
  totalAmount: number;
  dayShift: InvoiceShift;
  nightShift: InvoiceShift;
  totalChargeableHours: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceConfig {
  configId: string;
  orgId: string;
  chargeRate: number;
  currency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  taxRate?: number;
  notes?: string;
  updatedAt: Date;
  updatedBy: string;
}
```

---

## 5. Firestore Data Structure

### 5.1 Collection Hierarchy

```
/organizations/{orgId}
  └── /projects/{projectId}
        └── /sites/{siteId}
              └── /rigs/{rigId}

/reports/{reportId}
  ├── /dayShift (document)
  │     ├── /activities/{activityId}
  │     └── /personnel/{personId}
  └── /nightShift (document)
        ├── /activities/{activityId}
        └── /personnel/{personId}

/sites/{siteId}_{boreholeNo}  # Flattened structure
  └── /tests/{testId}
        ├── discharge1
        ├── discharge2
        ├── discharge3
        ├── recovery
        ├── observationHole1
        ├── observationHole2
        ├── observationHole3
        └── quality_rate{rateIndex}

/materials/{materialId}
/requisitions/{requisitionId}
/inventory-transactions/{transactionId}
/pre-start-checks/{checkId}
/invoices/{invoiceId}
/invoice-configs/{configId}
```

### 5.2 Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "siteId", "order": "ASCENDING" },
        { "fieldPath": "reportDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "client", "order": "ASCENDING" },
        { "fieldPath": "rigId", "order": "ASCENDING" },
        { "fieldPath": "reportDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 6. User Workflows

### 6.1 Site Manager Workflow

```
1. Login (OIDC with Microsoft Entra ID)
   ↓
2. Navigate to Upload Page
   ↓
3. Drag & Drop Excel File
   ↓
4. Client-side Parsing (Excel Parsing Service)
   ↓
5. Preview Extracted Data
   - Header Information
   - Day Shift Activities & Personnel
   - Night Shift Activities & Personnel
   - Challenges
   ↓
6. Validation Check
   - Mandatory fields present
   - Time format validation
   - Chargeable hours calculation
   ↓
7. Submit Report
   ↓
8. Upload to Cloud Storage
   ↓
9. Save to Firestore
   ↓
10. Status: "Submitted"
```

### 6.2 Office Manager Workflow

```
1. Login (OIDC with Microsoft Entra ID)
   ↓
2. Navigate to Dashboard
   ↓
3. Apply Filters
   - Date Range
   - Client
   - Project/Site
   - Rig
   - Shift (Day/Night)
   - Chargeable Flag
   ↓
4. View Metrics Cards
   - Total Hours (Day, Night, Combined)
   - Chargeable vs Non-Chargeable Split
   - Activities Count
   - Personnel Count & Hours
   ↓
5. Review Reports Table
   - Daily Summary
   - Expandable Activities
   - Personnel Details
   - Challenges List
   ↓
6. Export Data
   - CSV/XLSX/PDF
   ↓
7. Mark as Reviewed/Approved
   ↓
8. Add Review Notes
   ↓
9. Update Status in Firestore
```

---

## 7. Current Limitations & Technical Debt

### 7.1 Performance Issues
- ❌ Large bundle size (Angular + all modules)
- ❌ No code splitting at route level
- ❌ Client-side only rendering (no SEO benefits)
- ❌ No server-side data fetching optimization

### 7.2 Architecture Issues
- ❌ Monolithic Angular application
- ❌ Tight coupling between modules
- ❌ Shared state management is ad-hoc
- ❌ No clear separation of concerns

### 7.3 Code Quality Issues
- ❌ Mixed TypeScript strictness
- ❌ Inconsistent error handling
- ❌ Limited test coverage
- ❌ No comprehensive logging strategy

### 7.4 Firebase Integration Issues
- ❌ No Cloud Functions implemented yet
- ❌ Security rules not fully defined
- ❌ No offline support
- ❌ No real-time subscriptions

---

## 8. Dependencies Analysis

### 8.1 Critical Dependencies

| Package | Version | Purpose | Migration Impact |
|----------|----------|---------|-----------------|
| @angular/fire | 20.0.1 | Firebase SDK | ⚠️ Needs replacement with Firebase JS SDK |
| xlsx | 0.18.5 | Excel parsing | ✅ Can reuse in Next.js |
| chart.js | 4.5.1 | Charts | ⚠️ Consider Recharts/Chart.js React wrapper |
| ag-grid-angular | 34.2.0 | Data grids | ⚠️ Need AG Grid React version |
| jspdf | 3.0.3 | PDF generation | ✅ Can reuse |
| file-saver | 2.0.5 | File downloads | ✅ Can reuse |

### 8.2 Angular-Specific Dependencies (To Replace)

| Package | Replacement | Notes |
|----------|-------------|--------|
| @angular/core | React/Next.js | Complete rewrite |
| @angular/router | Next.js App Router | Route migration |
| @angular/forms | React Hook Form / Zod | Form handling |
| @angular/common | React utilities | Utility functions |
| rxjs | React Query / SWR | Data fetching |

---

## 9. Security Considerations

### 9.1 Current Security Measures
- ✅ Firebase Authentication with OIDC
- ✅ Role-based access control (client-side)
- ✅ Firestore security rules (partial)
- ✅ HTTPS enforced (Firebase Hosting)

### 9.2 Security Gaps
- ❌ No server-side validation
- ❌ No rate limiting
- ❌ No CSRF protection (not needed for Firebase)
- ❌ No input sanitization
- ❌ No audit logging

---

## 10. Migration Complexity Assessment

### Component Complexity Matrix

| Module | Lines of Code | Dependencies | Complexity | Migration Effort |
|---------|---------------|---------------|--------------|-------------------|
| Excel Parsing Service | ~1,500 | XLSX, Models | HIGH | 5 days |
| Firestore Service | ~900 | Firebase SDK | MEDIUM | 3 days |
| Auth Service | ~200 | Firebase Auth | MEDIUM | 2 days |
| Upload Component | ~300 | Parsing, Storage | MEDIUM | 2 days |
| Dashboard | ~400 | Charts, Grids | MEDIUM | 3 days |
| Financial Module | ~800 | Forms, Tables | HIGH | 5 days |
| Fleet Module | ~600 | Forms, Tables | MEDIUM | 4 days |
| OHS Module | ~400 | Forms | LOW | 2 days |
| Personnel Module | ~500 | Forms, Tables | MEDIUM | 3 days |
| Supply Chain Module | ~600 | Forms, Tables | MEDIUM | 4 days |

**Total Estimated Migration Effort:** ~33 days

---

## 11. Key Insights for Migration

### 11.1 What Works Well
- ✅ Clear separation of concerns (services, components, models)
- ✅ TypeScript interfaces are well-defined
- ✅ Firebase integration is straightforward
- ✅ Excel parsing logic is comprehensive

### 11.2 What Needs Improvement
- ⚠️ Excel parsing is tightly coupled to Angular
- ⚠️ No centralized state management
- ⚠️ Limited error handling and logging
- ⚠️ No comprehensive test suite

### 11.3 Migration Priorities
1. **HIGH:** Excel parsing service (business-critical)
2. **HIGH:** Authentication flow (security-critical)
3. **HIGH:** Firestore integration (data-critical)
4. **MEDIUM:** UI components (can be rebuilt)
5. **LOW:** Styling (Tailwind can be reused)

---

## 12. Recommendations

### 12.1 Before Migration
1. Add comprehensive test coverage
2. Document all business logic
3. Create performance baseline
4. Set up monitoring and logging
5. Define rollback procedures

### 12.2 During Migration
1. Migrate services first (easier to test)
2. Use feature flags for gradual rollout
3. Maintain parallel systems
4. Continuous integration testing
5. Regular stakeholder reviews

### 12.3 After Migration
1. Performance optimization
2. SEO enhancement
3. Accessibility audit
4. Security review
5. Documentation updates

---

**Document Version:** 1.0  
**Last Updated:** February 1, 2026  
**Next Review:** Target Architecture Design
