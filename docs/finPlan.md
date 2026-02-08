# Financial Module Development Plan

**Created:** 2026-02-08  
**Status:** Draft  
**Version:** 1.0

---

## Executive Summary

This document provides a comprehensive development plan for the Financial module, addressing outstanding implementation tasks, incomplete features, technical debt, and the design and implementation of a new Payroll tile. The plan is organized into clear sections for current status, outstanding tasks, new feature specifications, and a step-by-step implementation roadmap.

---

## 1. Current Status Analysis

### 1.1 Existing Financial Module Structure

The Financial module currently consists of the following components:

| Component | Status | Description |
|-----------|--------|-------------|
| **FinancialComponent** | ✅ Complete | Main landing page with navigation tiles |
| **InvoicesComponent** | ✅ Complete | Invoice listing, filtering, and detail view |
| **InvoiceConfigComponent** | ✅ Complete | Invoice configuration (charge rate, prefix, etc.) |
| **RequisitionsComponent** | ⚠️ Placeholder | Only basic navigation, no functionality |
| **IncomeExpenseComponent** | ⚠️ Placeholder | Only basic navigation, no functionality |

### 1.2 Current Tiles in Financial Control

The [`FinancialComponent`](src/app/modules/financial/financial.component.ts:1) displays 4 tiles:

1. **Requisitions** - Manage purchase requisitions
2. **Invoices** - Handle invoicing
3. **Income & Expense** - Track income and expenses
4. **Invoice Settings** - Configure invoice rates and settings

### 1.3 Dashboard Integration

The [`DashboardComponent`](src/app/pages/dashboard/dashboard.ts:1) includes a "Financial Control" tile that navigates to `/financial` route.

---

## 2. Outstanding Implementation Tasks

### 2.1 High Priority Tasks

#### Task 2.1.1: Complete Requisitions Module
**Status:** ⚠️ Placeholder Only  
**Priority:** HIGH  
**Effort:** LARGE  
**Description:** The Requisitions component is a placeholder with no actual functionality. It needs full implementation for material requisition workflow.

**Requirements:**
- Material Master integration for selecting materials
- Requisition creation form (title, description, items, priority, required date)
- Requisition approval workflow (Draft → Submitted → Approved → Fulfilled)
- Requisition listing with filters (status, priority, date range)
- Requisition detail view with item breakdown
- Integration with Supply Chain module for inventory checking

**Files to Create/Modify:**
- [`src/app/modules/financial/requisitions/requisitions.component.ts`](src/app/modules/financial/requisitions/requisitions.component.ts:1)
- [`src/app/modules/financial/requisitions/requisitions.module.ts`](src/app/modules/financial/requisitions/requisitions.module.ts:1)
- Create HTML template
- Create SCSS styles

**Dependencies:**
- [`Requisition`](src/app/models/pumping-data.model.ts:328) model already exists
- [`FirestoreService`](src/app/services/firestore.service.ts:1) methods already exist:
  - `getRequisitionsByOrg()`
  - `getRequisition()`
  - `createRequisition()`
  - `updateRequisition()`
  - `deleteRequisition()`

---

#### Task 2.1.2: Complete Income & Expense Module
**Status:** ⚠️ Placeholder Only  
**Priority:** HIGH  
**Effort:** LARGE  
**Description:** The Income & Expense component is a placeholder with no actual functionality. It needs full implementation for tracking income and expenses.

**Requirements:**
- Income entry form (source, amount, date, category, description)
- Expense entry form (category, amount, date, description, payee, receipt reference)
- Income/Expense listing with filters (date range, category, type)
- Income/Expense detail view
- Summary dashboard with totals (total income, total expenses, net balance)
- Charts for income vs. expense visualization
- Export functionality (CSV, PDF)

**Data Models Needed:**
```typescript
export interface Income {
  incomeId: string;
  orgId: string;
  source: string; // e.g., 'Invoice', 'Other'
  amount: number;
  currency: string;
  incomeDate: Date;
  category: string;
  description?: string;
  reference?: string; // Invoice number, receipt number
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  expenseId: string;
  orgId: string;
  category: string; // e.g., 'Fuel', 'Materials', 'Salaries'
  amount: number;
  currency: string;
  expenseDate: Date;
  description?: string;
  payee?: string; // Vendor or employee name
  receiptRef?: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Files to Create/Modify:**
- [`src/app/modules/financial/income-expense/income-expense.component.ts`](src/app/modules/financial/income-expense/income-expense.component.ts:1)
- [`src/app/modules/financial/income-expense/income-expense.module.ts`](src/app/modules/financial/income-expense/income-expense.module.ts:1)
- Create HTML template
- Create SCSS styles

**Firestore Methods Needed:**
```typescript
async getIncomes(orgId?: string): Promise<Income[]>
async getIncome(incomeId: string): Promise<Income | null>
async createIncome(income: Omit<Income, 'incomeId'>): Promise<string>
async updateIncome(incomeId: string, updates: Partial<Income>): Promise<void>
async deleteIncome(incomeId: string): Promise<void>

async getExpenses(orgId?: string): Promise<Expense[]>
async getExpense(expenseId: string): Promise<Expense | null>
async createExpense(expense: Omit<Expense, 'expenseId'>): Promise<string>
async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void>
async deleteExpense(expenseId: string): Promise<void>
```

---

#### Task 2.1.3: Integrate Invoice Generation with Progress Reports
**Status:** ⚠️ Partially Implemented  
**Priority:** HIGH  
**Effort:** MEDIUM  
**Description:** The [`InvoiceService`](src/app/services/invoice.service.ts:1) has methods to generate invoices from reports, but the integration with the upload component is not complete.

**Requirements:**
- Trigger automatic invoice generation when a progress report is uploaded
- Check if invoice already exists for a report to avoid duplicates
- Display invoice generation status in upload component
- Allow manual invoice generation from existing reports
- Link invoices to their source reports

**Files to Modify:**
- [`src/app/components/upload/upload.component.ts`](src/app/components/upload/upload.component.ts:1) - Add invoice generation trigger after report save
- [`src/app/services/invoice.service.ts`](src/app/services/invoice.service.ts:1) - Add `incrementInvoiceNumber()` method call after successful invoice generation

---

### 2.2 Medium Priority Tasks

#### Task 2.2.1: Add Invoice Export Functionality
**Status:** ❌ Not Implemented  
**Priority:** MEDIUM  
**Effort:** MEDIUM  
**Description:** The Invoices component displays invoices but has no export functionality.

**Requirements:**
- Export single invoice as PDF
- Export filtered invoice list as CSV
- Export filtered invoice list as Excel
- Print invoice functionality

**Implementation:**
- Use libraries like `jspdf` for PDF generation
- Use `xlsx` library for Excel export
- Add export buttons to [`invoices.component.html`](src/app/modules/financial/invoices/invoices.component.html:1)

---

#### Task 2.2.2: Add Invoice Payment Tracking
**Status:** ❌ Not Implemented  
**Priority:** MEDIUM  
**Effort:** MEDIUM  
**Description:** Invoices have status tracking but no payment amount or payment date tracking.

**Requirements:**
- Add `paymentAmount` field to [`Invoice`](src/app/models/pumping-data.model.ts:433) model
- Add `paymentDate` field to [`Invoice`](src/app/models/pumping-data.model.ts:433) model
- Add payment entry form in invoice detail view
- Track partial payments
- Update invoice status to "Paid" when fully paid

**Data Model Updates:**
```typescript
export interface Invoice {
  // ... existing fields
  paymentAmount?: number;
  paymentDate?: Date;
  partialPayments?: Payment[];
}

export interface Payment {
  paymentId: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string; // e.g., 'Bank Transfer', 'Cash', 'Check'
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}
```

---

#### Task 2.2.3: Add Invoice Notes and Attachments
**Status:** ❌ Not Implemented  
**Priority:** LOW  
**Effort:** SMALL  
**Description:** Invoices have no notes field or attachment support.

**Requirements:**
- Add `notes` field to [`Invoice`](src/app/models/pumping-data.model.ts:433) model
- Add `attachments` array to [`Invoice`](src/app/models/pumping-data.model.ts:433) model
- Allow adding notes to invoices
- Allow uploading attachments (PDFs, images) to invoices
- Display attachments in invoice detail view

---

### 2.3 Low Priority Tasks

#### Task 2.3.1: Add Invoice Search Enhancement
**Status:** ⚠️ Basic Implementation  
**Priority:** LOW  
**Effort:** SMALL  
**Description:** Current search is basic string matching. Could be enhanced.

**Requirements:**
- Add advanced search filters (invoice number range, amount range)
- Add saved search filters
- Add search history
- Improve search performance with debouncing

---

#### Task 2.3.2: Add Invoice Dashboard Metrics
**Status:** ❌ Not Implemented  
**Priority:** LOW  
**Effort:** SMALL  
**Description:** No summary metrics on the invoices page.

**Requirements:**
- Add summary cards showing:
  - Total invoices
  - Total amount
  - Outstanding amount
  - Paid amount
  - Overdue amount
- Add charts for monthly revenue trends
- Add charts for payment status distribution

---

## 3. Technical Debt

### 3.1 Code Quality Issues

#### Debt 3.1.1: Inconsistent Error Handling
**Location:** Multiple components  
**Severity:** MEDIUM  
**Description:** Error handling is inconsistent across components. Some use try-catch with console.error, others don't.

**Remediation:**
- Implement centralized error handling service
- Add user-friendly error messages
- Add error logging to a centralized service
- Implement retry logic for failed operations

---

#### Debt 3.1.2: Missing Loading States
**Location:** [`invoices.component.ts`](src/app/modules/financial/invoices/invoices.component.ts:1), [`invoice-config.component.ts`](src/app/modules/financial/invoice-config/invoice-config.component.ts:1)  
**Severity:** LOW  
**Description:** Loading states exist but could be improved with skeleton screens.

**Remediation:**
- Add skeleton loading components for better UX
- Implement optimistic UI updates
- Add loading indicators for individual actions

---

#### Debt 3.1.3: No Unit Tests
**Location:** All financial components  
**Severity:** HIGH  
**Description:** No unit tests exist for financial components.

**Remediation:**
- Create unit tests for [`InvoicesComponent`](src/app/modules/financial/invoices/invoices.component.ts:1)
- Create unit tests for [`InvoiceConfigComponent`](src/app/modules/financial/invoice-config/invoice-config.component.ts:1)
- Create unit tests for [`InvoiceService`](src/app/services/invoice.service.ts:1)
- Create unit tests for [`InvoiceConfigService`](src/app/services/invoice-config.service.ts:1)
- Test edge cases (empty data, invalid inputs, network errors)

---

#### Debt 3.1.4: TypeScript Strict Mode Violations
**Location:** Multiple files  
**Severity:** LOW  
**Description:** Some files may have implicit `any` types or missing type annotations.

**Remediation:**
- Enable strict mode in `tsconfig.json`
- Add proper type annotations
- Remove `any` types where possible
- Use type guards for runtime type checking

---

#### Debt 3.1.5: Inconsistent Styling Approach
**Location:** All components  
**Severity:** MEDIUM  
**Description:** Components use inline styles in templates and component-scoped SCSS. No unified design system.

**Remediation:**
- Implement design system as outlined in [`ui-ux-improvement-plan.md`](docs/ui-ux-improvement-plan.md:1)
- Create shared SCSS variables for colors, spacing, typography
- Use consistent component styling patterns
- Follow the design system recommendations

---

## 4. New Feature: Payroll Tile

### 4.1 Overview

**Status:** ❌ Not Implemented  
**Priority:** HIGH  
**Effort:** LARGE  
**Description:** Design and implement a comprehensive Payroll tile to be integrated into the Financial Control dashboard alongside existing Invoices, Requisitions, and Income & Expense tiles.

---

### 4.2 Requirements

#### 4.2.1 Functional Requirements

**FR-1: Employee Management**
- View list of all employees
- Add new employee
- Edit employee details
- Deactivate/terminate employees
- Employee profile view with employment history

**FR-2: Pay Period Management**
- Define pay periods (weekly, bi-weekly, monthly)
- Create new pay period
- Close pay period
- View pay period history

**FR-3: Salary Management**
- Define salary structures (base salary, hourly rate, overtime rate)
- Assign salary to employees
- Manage salary history
- Support multiple salary types (regular, overtime, holiday, sick leave)

**FR-4: Time Tracking**
- Track regular hours worked
- Track overtime hours
- Track leave hours (paid, unpaid)
- Track holiday hours
- Track sick hours
- Timesheet entry and approval workflow

**FR-5: Deductions Management**
- Define deduction types (tax, pension, medical aid, other)
- Configure deduction rates/amounts
- Assign deductions to employees
- Calculate net pay

**FR-6: Payroll Processing**
- Generate payslips for pay period
- Calculate gross pay, deductions, net pay
- Batch payslip generation
- Payslip approval workflow
- Send payslips to employees (email/print)

**FR-7: Reporting**
- Payroll summary reports
- Employee earnings reports
- Tax reports
- Deduction reports
- Year-to-date reports
- Export reports (PDF, CSV, Excel)

**FR-8: Integration**
- Integration with Personnel module (employee data)
- Integration with Income & Expense (salary payments)
- Integration with Invoices (client billing for payroll costs)
- Integration with Supply Chain (equipment/material costs)

---

### 4.3 Data Structures

#### 4.3.1 Employee Model

```typescript
export interface Employee {
  employeeId: string;
  orgId: string;
  
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  
  // Employment Information
  employeeNumber: string; // Unique employee number
  position: string;
  department: string;
  hireDate: Timestamp;
  terminationDate?: Timestamp;
  employmentStatus: 'Active' | 'Inactive' | 'OnLeave' | 'Terminated';
  
  // Compensation
  salaryStructureId: string;
  hourlyRate?: number;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountType: 'Checking' | 'Savings';
  };
  
  // Tax Information
  taxId?: string;
  taxNumber?: string;
  
  // Audit
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 4.3.2 Pay Period Model

```typescript
export interface PayPeriod {
  payPeriodId: string;
  orgId: string;
  
  periodType: 'Weekly' | 'BiWeekly' | 'Monthly';
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'Open' | 'Processing' | 'Closed';
  
  // Summary
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  
  // Audit
  processedBy: string;
  processedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 4.3.3 Salary Structure Model

```typescript
export interface SalaryStructure {
  structureId: string;
  orgId: string;
  
  name: string; // e.g., "Standard Full-Time", "Hourly Worker"
  type: 'Salaried' | 'Hourly';
  
  // Compensation Details
  baseSalary?: number; // Monthly base salary
  hourlyRate?: number; // Hourly rate
  overtimeRate?: number; // Overtime multiplier (e.g., 1.5x)
  holidayRate?: number; // Holiday pay multiplier
  sickRate?: number; // Sick leave pay multiplier
  
  // Allowances
  housingAllowance?: number;
  transportAllowance?: number;
  medicalAllowance?: number;
  otherAllowances?: number;
  
  // Deductions
  pensionRate?: number; // Percentage
  taxRate?: number; // Percentage
  medicalAidRate?: number; // Fixed amount or percentage
  
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 4.3.4 Timesheet Model

```typescript
export interface Timesheet {
  timesheetId: string;
  orgId: string;
  employeeId: string;
  payPeriodId: string;
  
  // Time Entries
  regularHours: number;
  overtimeHours: number;
  leaveHours: number;
  holidayHours: number;
  sickHours: number;
  
  // Approval
  submittedBy: string;
  submittedAt: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  
  // Notes
  notes?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 4.3.5 Deduction Model

```typescript
export interface Deduction {
  deductionId: string;
  orgId: string;
  
  name: string; // e.g., "PAYE Tax", "Pension Fund", "Medical Aid"
  type: 'Tax' | 'Pension' | 'MedicalAid' | 'Other';
  
  // Calculation
  rateType: 'Percentage' | 'FixedAmount';
  rate: number; // Percentage or fixed amount
  
  isActive: boolean;
  description?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 4.3.6 Payslip Model

```typescript
export interface Payslip {
  payslipId: string;
  orgId: string;
  payPeriodId: string;
  employeeId: string;
  
  // Period
  startDate: Timestamp;
  endDate: Timestamp;
  payDate: Timestamp;
  
  // Earnings
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  sickPay: number;
  otherPay: number;
  grossPay: number;
  
  // Deductions
  taxDeduction: number;
  pensionDeduction: number;
  medicalAidDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  
  // Net Pay
  netPay: number;
  
  // Status
  status: 'Draft' | 'Generated' | 'Sent' | 'Paid';
  
  // Delivery
  sentMethod?: 'Email' | 'Print' | 'Manual';
  sentAt?: Timestamp;
  
  // Audit
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 4.3.7 Employee Deduction Assignment Model

```typescript
export interface EmployeeDeduction {
  assignmentId: string;
  orgId: string;
  employeeId: string;
  deductionId: string;
  
  // Override default rate
  customRate?: number; // If different from deduction default rate
  
  isActive: boolean;
  effectiveFrom: Timestamp;
  effectiveTo?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 4.4 UI Components

#### 4.4.1 Payroll Dashboard Component

**File:** `src/app/modules/financial/payroll/payroll.component.ts`  
**Template:** `src/app/modules/financial/payroll/payroll.component.html`  
**Styles:** `src/app/modules/financial/payroll/payroll.component.scss`

**Features:**
- Summary cards (total employees, active pay periods, pending timesheets)
- Pay period list with status indicators
- Quick actions (new pay period, process payroll, view reports)
- Charts (payroll trends, cost distribution)

---

#### 4.4.2 Pay Period Management Component

**File:** `src/app/modules/financial/payroll/pay-periods/pay-periods.component.ts`  
**Template:** `src/app/modules/financial/payroll/pay-periods/pay-periods.component.html`  
**Styles:** `src/app/modules/financial/payroll/pay-periods/pay-periods.component.scss`

**Features:**
- Pay period listing with filters (status, date range)
- Create/edit pay period modal
- Pay period status workflow (Open → Processing → Closed)
- Employee count per period

---

#### 4.4.3 Timesheet Management Component

**File:** `src/app/modules/financial/payroll/timesheets/timesheets.component.ts`  
**Template:** `src/app/modules/financial/payroll/timesheets/timesheets.component.html`  
**Styles:** `src/app/modules/financial/payroll/timesheets/timesheets.component.scss`

**Features:**
- Timesheet listing with filters (employee, pay period, status)
- Timesheet entry/edit form
- Bulk approval workflow
- Hours summary per employee
- Export functionality

---

#### 4.4.4 Payslip Generation Component

**File:** `src/app/modules/financial/payroll/payslips/payslips.component.ts`  
**Template:** `src/app/modules/financial/payroll/payslips/payslips.component.html`  
**Styles:** `src/app/modules/financial/payroll/payslips/payslips.component.scss`

**Features:**
- Payslip listing with filters (pay period, employee, status)
- Generate payslips for pay period
- Preview payslip
- Send payslips (email/print)
- Export payslips (PDF batch)

---

#### 4.4.5 Salary Structures Component

**File:** `src/app/modules/financial/payroll/salary-structures/salary-structures.component.ts`  
**Template:** `src/app/modules/financial/payroll/salary-structures/salary-structures.component.html`  
**Styles:** `src/app/modules/financial/payroll/salary-structures/salary-structures.component.scss`

**Features:**
- Salary structure listing
- Create/edit salary structure form
- Assign employees to salary structures
- Configure rates and allowances
- Configure deductions

---

#### 4.4.6 Deductions Management Component

**File:** `src/app/modules/financial/payroll/deductions/deductions.component.ts`  
**Template:** `src/app/modules/financial/payroll/deductions/deductions.component.html`  
**Styles:** `src/app/modules/financial/payroll/deductions/deductions.component.scss`

**Features:**
- Deduction types listing
- Create/edit deduction type form
- Configure rates (percentage or fixed)
- Activate/deactivate deductions
- Assign deductions to employees

---

#### 4.4.7 Employee Payroll Profile Component

**File:** `src/app/modules/financial/payroll/employee-profile/employee-profile.component.ts`  
**Template:** `src/app/modules/financial/payroll/employee-profile/employee-profile.component.html`  
**Styles:** `src/app/modules/financial/payroll/employee-profile/employee-profile.component.scss`

**Features:**
- Employee payroll information view
- Salary structure assignment
- Deduction assignments
- Employment history
- Payslip history

---

### 4.5 Service Layer

#### 4.5.1 Payroll Service

**File:** `src/app/services/payroll.service.ts`

**Methods:**
```typescript
// Employee Management
async getEmployees(orgId?: string): Promise<Employee[]>
async getEmployee(employeeId: string): Promise<Employee | null>
async createEmployee(employee: Omit<Employee, 'employeeId'>): Promise<string>
async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void>
async terminateEmployee(employeeId: string, terminationDate: Date, reason: string): Promise<void>

// Pay Period Management
async getPayPeriods(orgId?: string): Promise<PayPeriod[]>
async getPayPeriod(payPeriodId: string): Promise<PayPeriod | null>
async createPayPeriod(payPeriod: Omit<PayPeriod, 'payPeriodId'>): Promise<string>
async updatePayPeriod(payPeriodId: string, updates: Partial<PayPeriod>): Promise<void>
async closePayPeriod(payPeriodId: string): Promise<void>

// Timesheet Management
async getTimesheets(orgId?: string, filters?: TimesheetFilters): Promise<Timesheet[]>
async getTimesheet(timesheetId: string): Promise<Timesheet | null>
async createTimesheet(timesheet: Omit<Timesheet, 'timesheetId'>): Promise<string>
async updateTimesheet(timesheetId: string, updates: Partial<Timesheet>): Promise<void>
async approveTimesheet(timesheetId: string, approvedBy: string): Promise<void>
async bulkApproveTimesheets(timesheetIds: string[], approvedBy: string): Promise<void>

// Salary Structures
async getSalaryStructures(orgId?: string): Promise<SalaryStructure[]>
async getSalaryStructure(structureId: string): Promise<SalaryStructure | null>
async createSalaryStructure(structure: Omit<SalaryStructure, 'structureId'>): Promise<string>
async updateSalaryStructure(structureId: string, updates: Partial<SalaryStructure>): Promise<void>
async deleteSalaryStructure(structureId: string): Promise<void>

// Deductions
async getDeductions(orgId?: string): Promise<Deduction[]>
async getDeduction(deductionId: string): Promise<Deduction | null>
async createDeduction(deduction: Omit<Deduction, 'deductionId'>): Promise<string>
async updateDeduction(deductionId: string, updates: Partial<Deduction>): Promise<void>

// Payslip Generation
async generatePayslips(payPeriodId: string): Promise<Payslip[]>
async getPayslip(payslipId: string): Promise<Payslip | null>
async sendPayslip(payslipId: string, method: 'Email' | 'Print'): Promise<void>
async updatePayslipStatus(payslipId: string, status: Payslip['status']): Promise<void>

// Calculations
calculateGrossPay(employeeId: string, timesheet: Timesheet, salaryStructure: SalaryStructure): number
calculateDeductions(grossPay: number, employeeDeductions: EmployeeDeduction[]): number
calculateNetPay(grossPay: number, totalDeductions: number): number
```

---

#### 4.5.2 Firestore Service Updates

**File:** `src/app/services/firestore.service.ts`

**Methods to Add:**
```typescript
// Employee Collection
async getEmployees(orgId?: string): Promise<Employee[]>
async getEmployee(employeeId: string): Promise<Employee | null>
async createEmployee(employee: Omit<Employee, 'employeeId'>): Promise<string>
async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void>

// Pay Periods Collection
async getPayPeriods(orgId?: string): Promise<PayPeriod[]>
async getPayPeriod(payPeriodId: string): Promise<PayPeriod | null>
async createPayPeriod(payPeriod: Omit<PayPeriod, 'payPeriodId'>): Promise<string>
async updatePayPeriod(payPeriodId: string, updates: Partial<PayPeriod>): Promise<void>

// Timesheets Collection
async getTimesheets(orgId?: string, filters?: TimesheetFilters): Promise<Timesheet[]>
async getTimesheet(timesheetId: string): Promise<Timesheet | null>
async createTimesheet(timesheet: Omit<Timesheet, 'timesheetId'>): Promise<string>
async updateTimesheet(timesheetId: string, updates: Partial<Timesheet>): Promise<void>

// Salary Structures Collection
async getSalaryStructures(orgId?: string): Promise<SalaryStructure[]>
async getSalaryStructure(structureId: string): Promise<SalaryStructure | null>
async createSalaryStructure(structure: Omit<SalaryStructure, 'structureId'>): Promise<string>
async updateSalaryStructure(structureId: string, updates: Partial<SalaryStructure>): Promise<void>

// Deductions Collection
async getDeductions(orgId?: string): Promise<Deduction[]>
async getDeduction(deductionId: string): Promise<Deduction | null>
async createDeduction(deduction: Omit<Deduction, 'deductionId'>): Promise<string>
async updateDeduction(deductionId: string, updates: Partial<Deduction>): Promise<void>

// Employee Deductions Collection
async getEmployeeDeductions(employeeId: string): Promise<EmployeeDeduction[]>
async assignEmployeeDeduction(employeeId: string, deductionId: string, customRate?: number): Promise<void>
async updateEmployeeDeduction(assignmentId: string, updates: Partial<EmployeeDeduction>): Promise<void>
async removeEmployeeDeduction(assignmentId: string): Promise<void>

// Payslips Collection
async getPayslips(orgId?: string, filters?: PayslipFilters): Promise<Payslip[]>
async getPayslip(payslipId: string): Promise<Payslip | null>
async createPayslip(payslip: Omit<Payslip, 'payslipId'>): Promise<string>
async updatePayslip(payslipId: string, updates: Partial<Payslip>): Promise<void>
async deletePayslip(payslipId: string): Promise<void>
```

---

### 4.6 Module Structure

```
src/app/modules/financial/payroll/
├── payroll.module.ts
├── payroll-routing.module.ts
├── payroll.component.ts (Dashboard)
├── payroll.component.html
├── payroll.component.scss
├── pay-periods/
│   ├── pay-periods.component.ts
│   ├── pay-periods.component.html
│   └── pay-periods.component.scss
├── timesheets/
│   ├── timesheets.component.ts
│   ├── timesheets.component.html
│   └── timesheets.component.scss
├── payslips/
│   ├── payslips.component.ts
│   ├── payslips.component.html
│   └── payslips.component.scss
├── salary-structures/
│   ├── salary-structures.component.ts
│   ├── salary-structures.component.html
│   └── salary-structures.component.scss
├── deductions/
│   ├── deductions.component.ts
│   ├── deductions.component.html
│   └── deductions.component.scss
└── employee-profile/
    ├── employee-profile.component.ts
    ├── employee-profile.component.html
    └── employee-profile.component.scss
```

---

### 4.7 Dashboard Integration

**Update Required:**

1. **Add Payroll Tile to Dashboard** ([`dashboard.component.ts`](src/app/pages/dashboard/dashboard/dashboard.component.ts:1))
   ```typescript
   {
     id: 'payroll',
     title: 'Payroll',
     description: 'Employee salaries, timesheets, and payslips',
     icon: 'banknote', // or appropriate icon
     color: 'indigo', // or appropriate color
     route: '/financial/payroll'
   }
   ```

2. **Update Financial Component** ([`financial.component.ts`](src/app/modules/financial/financial.component.ts:1))
   - Add Payroll tile to the grid (5th tile)

3. **Update Financial Module Routes** ([`financial.module.ts`](src/app/modules/financial/financial.module.ts:1))
   ```typescript
   { path: 'payroll', loadChildren: () => import('./payroll/payroll.module').then(m => m.PayrollModule) }
   ```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up data models, services, and basic module structure

#### Week 1 Tasks:
- [ ] Add payroll data models to [`pumping-data.model.ts`](src/app/models/pumping-data.model.ts:1)
  - [ ] Employee interface
  - [ ] PayPeriod interface
  - [ ] SalaryStructure interface
  - [ ] Timesheet interface
  - [ ] Deduction interface
  - [ ] Payslip interface
  - [ ] EmployeeDeduction interface
  - [ ] Export all new models from [`index.ts`](src/app/models/index.ts:1)

- [ ] Create [`PayrollService`](src/app/services/payroll.service.ts) with basic CRUD methods
  - [ ] Employee management methods
  - [ ] Pay period management methods
  - [ ] Timesheet management methods
  - [ ] Salary structure management methods
  - [ ] Deduction management methods
  - [ ] Payslip generation methods
  - [ ] Calculation methods (gross pay, deductions, net pay)

- [ ] Add Firestore methods to [`FirestoreService`](src/app/services/firestore.service.ts:1)
  - [ ] Employee collection methods
  - [ ] Pay periods collection methods
  - [ ] Timesheets collection methods
  - [ ] Salary structures collection methods
  - [ ] Deductions collection methods
  - [ ] Employee deductions collection methods
  - [ ] Payslips collection methods

- [ ] Create Payroll module structure
  - [ ] Create [`payroll.module.ts`](src/app/modules/financial/payroll/payroll.module.ts)
  - [ ] Create [`payroll-routing.module.ts`](src/app/modules/financial/payroll/payroll-routing.module.ts)
  - [ ] Configure routes for all sub-components

- [ ] Add Payroll tile to Dashboard
  - [ ] Update [`dashboard.component.ts`](src/app/pages/dashboard/dashboard/dashboard.component.ts:1) with payroll tile
  - [ ] Update [`dashboard.html`](src/app/pages/dashboard/dashboard/dashboard.html) with payroll tile

- [ ] Add Payroll route to Financial module
  - [ ] Update [`financial.module.ts`](src/app/modules/financial/financial.module.ts:1) with payroll route

---

### Phase 2: Core Payroll Features (Week 3-5)

**Goal:** Implement employee management, pay period management, and timesheet functionality

#### Week 3 Tasks:
- [ ] Create Payroll Dashboard component
  - [ ] Summary cards (total employees, active periods, pending timesheets)
  - [ ] Pay period list view
  - [ ] Quick actions
  - [ ] Charts for payroll trends

- [ ] Create Pay Period Management component
  - [ ] Pay period listing with filters
  - [ ] Create/edit pay period modal
  - [ ] Status workflow (Open → Processing → Closed)
  - [ ] Employee count per period

- [ ] Create Timesheet Management component
  - [ ] Timesheet listing with filters
  - [ ] Timesheet entry/edit form
  - [ ] Hours calculation (regular, overtime, leave, holiday, sick)
  - [ ] Bulk approval workflow
  - [ ] Export functionality

- [ ] Implement Payroll Service methods
  - [ ] Complete employee CRUD operations
  - [ ] Complete pay period CRUD operations
  - [ ] Complete timesheet CRUD operations
  - [ ] Implement calculation methods

- [ ] Implement Firestore methods
  - [ ] Complete employee collection operations
  - [ ] Complete pay periods collection operations
  - [ ] Complete timesheets collection operations

---

### Phase 3: Salary & Deduction Management (Week 6-7)

**Goal:** Implement salary structures, deductions, and employee payroll profiles

#### Week 6 Tasks:
- [ ] Create Salary Structures component
  - [ ] Salary structure listing
  - [ ] Create/edit salary structure form
  - [ ] Configure rates and allowances
  - [ ] Configure deductions
  - [ ] Assign employees to structures

- [ ] Create Deductions Management component
  - [ ] Deduction types listing
  - [ ] Create/edit deduction type form
  - [ ] Configure rates (percentage or fixed)
  - [ ] Activate/deactivate deductions

- [ ] Create Employee Payroll Profile component
  - [ ] Employee payroll information view
  - [ ] Salary structure assignment
  - [ ] Deduction assignments
  - [ ] Employment history
  - [ ] Payslip history

- [ ] Implement Payroll Service methods
  - [ ] Salary structure CRUD operations
  - [ ] Deduction CRUD operations
  - [ ] Employee deduction assignment methods

- [ ] Implement Firestore methods
  - [ ] Complete salary structures collection operations
  - [ ] Complete deductions collection operations
  - [ ] Complete employee deductions collection operations

---

### Phase 4: Payslip Generation (Week 8-9)

**Goal:** Implement payslip generation, delivery, and reporting

#### Week 8 Tasks:
- [ ] Create Payslip Generation component
  - [ ] Payslip listing with filters
  - [ ] Generate payslips for pay period
  - [ ] Preview payslip
  - [ ] Send payslips (email/print)
  - [ ] Export payslips (PDF batch)

- [ ] Implement Payroll Service methods
  - [ ] Payslip generation logic
  - [ ] Payslip CRUD operations
  - [ ] Send functionality

- [ ] Implement Firestore methods
  - [ ] Complete payslips collection operations

- [ ] Add PDF generation library
  - [ ] Install `jspdf` or similar library
  - [ ] Create payslip PDF template
  - [ ] Implement PDF generation service

---

### Phase 5: Integration & Polish (Week 10-11)

**Goal:** Integrate with existing modules, add reporting, and polish UI

#### Week 10 Tasks:
- [ ] Integrate with Personnel module
  - [ ] Link payroll to employee data
  - [ ] Sync employment status

- [ ] Integrate with Income & Expense module
  - [ ] Track salary payments as expenses
  - [ ] Reconcile payroll costs

- [ ] Add reporting features
  - [ ] Payroll summary reports
  - [ ] Employee earnings reports
  - [ ] Tax reports
  - [ ] Deduction reports
  - [ ] Year-to-date reports
  - [ ] Export all reports (PDF, CSV, Excel)

- [ ] Polish UI
  - [ ] Apply design system from [`ui-ux-improvement-plan.md`](docs/ui-ux-improvement-plan.md:1)
  - [ ] Add loading states
  - [ ] Add error handling
  - [ ] Improve responsiveness
  - [ ] Add accessibility features

- [ ] Add unit tests
  - [ ] Create unit tests for all payroll components
  - [ ] Create unit tests for PayrollService
  - [ ] Create unit tests for Firestore methods
  - [ ] Test edge cases and error scenarios

---

### Phase 6: Documentation & Deployment (Week 12)

**Goal:** Complete documentation and prepare for deployment

#### Week 12 Tasks:
- [ ] Update README with payroll module documentation
- [ ] Create payroll user guide
- [ ] Document API endpoints
- [ ] Create Firestore security rules for payroll collections
- [ ] Performance testing and optimization
- [ ] Deployment preparation

---

## 6. Risk Assessment & Mitigation

### 6.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|-------|--------|------------|------------|
| **Complex calculations** | High | Medium | Thoroughly test calculation logic with edge cases |
| **Data consistency** | High | Medium | Implement transactional updates where needed |
| **Performance with large datasets** | Medium | Medium | Implement pagination and lazy loading |
| **PDF generation complexity** | Medium | Low | Use established libraries, test thoroughly |

### 6.2 Integration Risks

| Risk | Impact | Probability | Mitigation |
|-------|--------|------------|------------|
| **Personnel module data mismatch** | High | Medium | Create data synchronization service |
| **Income & Expense integration** | Medium | Low | Clear data flow and reconciliation process |
| **Firestore document size limits** | Medium | Low | Implement chunking for large datasets |

---

## 7. Success Criteria

### 7.1 Functional Requirements

- [ ] Users can view all employees
- [ ] Users can create/edit/delete employees
- [ ] Users can manage pay periods
- [ ] Users can enter and approve timesheets
- [ ] Users can configure salary structures and deductions
- [ ] Users can generate and send payslips
- [ ] Users can view payroll reports
- [ ] Payroll tile appears on Financial Control dashboard
- [ ] Payroll tile navigates to full payroll module

### 7.2 Non-Functional Requirements

- [ ] All pages load within 3 seconds
- [ ] All calculations are accurate (tested with sample data)
- [ ] PDF generation works for all payslips
- [ ] Unit test coverage > 80%
- [ ] No TypeScript errors
- [ ] Design system applied consistently
- [ ] Mobile responsive design
- [ ] WCAG 2.1 AA accessibility compliance

### 7.3 Integration Requirements

- [ ] Payroll integrates with Personnel module employee data
- [ ] Salary payments tracked in Income & Expense
- [ ] Payroll costs reconcilable with Invoices
- [ ] No data duplication across modules

---

## 8. Dependencies

### 8.1 External Libraries

- **PDF Generation:** `jspdf` or `pdfmake`
- **Excel Export:** `xlsx` (already in project)
- **Date Handling:** `date-fns` (optional, for advanced date operations)

### 8.2 Internal Dependencies

- Personnel module (for employee data)
- Income & Expense module (for salary expense tracking)
- Invoice module (for client billing)
- Existing Firestore service
- Existing AuthService (for user authentication)

---

## 9. Estimated Timeline

| Phase | Duration | Start | End |
|--------|----------|------|------|
| **Phase 1: Foundation** | 2 weeks | Week 1 | Week 2 |
| **Phase 2: Core Features** | 3 weeks | Week 3 | Week 5 |
| **Phase 3: Salary & Deductions** | 2 weeks | Week 6 | Week 7 |
| **Phase 4: Payslip Generation** | 2 weeks | Week 8 | Week 9 |
| **Phase 5: Integration & Polish** | 2 weeks | Week 10 | Week 11 |
| **Phase 6: Documentation & Deployment** | 1 week | Week 12 | Week 12 |

**Total Estimated Duration:** 12 weeks

---

## 10. Next Steps

1. **Review and Approve:** Review this plan with stakeholders and get approval to proceed
2. **Prioritize Phases:** Confirm phase priorities and adjust timeline based on business needs
3. **Resource Allocation:** Assign developers to phases based on expertise
4. **Set Up Development Environment:** Ensure all dependencies are installed and configured
5. **Begin Implementation:** Start with Phase 1 and follow the roadmap

---

## Appendix A: File Structure Reference

### New Files to Create

```
src/app/modules/financial/payroll/
├── payroll.module.ts
├── payroll-routing.module.ts
├── payroll.component.ts
├── payroll.component.html
├── payroll.component.scss
├── pay-periods/
│   ├── pay-periods.module.ts
│   ├── pay-periods.component.ts
│   ├── pay-periods.component.html
│   └── pay-periods.component.scss
├── timesheets/
│   ├── timesheets.module.ts
│   ├── timesheets.component.ts
│   ├── timesheets.component.html
│   └── timesheets.component.scss
├── payslips/
│   ├── payslips.module.ts
│   ├── payslips.component.ts
│   ├── payslips.component.html
│   └── payslips.component.scss
├── salary-structures/
│   ├── salary-structures.module.ts
│   ├── salary-structures.component.ts
│   ├── salary-structures.component.html
│   └── salary-structures.component.scss
├── deductions/
│   ├── deductions.module.ts
│   ├── deductions.component.ts
│   ├── deductions.component.html
│   └── deductions.component.scss
└── employee-profile/
    ├── employee-profile.module.ts
    ├── employee-profile.component.ts
    ├── employee-profile.component.html
    └── employee-profile.component.scss
```

### Files to Modify

```
src/app/models/pumping-data.model.ts (Add payroll models)
src/app/models/index.ts (Export new models)
src/app/services/payroll.service.ts (Create)
src/app/services/firestore.service.ts (Add payroll methods)
src/app/pages/dashboard/dashboard.component.ts (Add payroll tile)
src/app/pages/dashboard/dashboard.html (Add payroll tile UI)
src/app/modules/financial/financial.component.ts (Add payroll tile)
src/app/modules/financial/financial.module.ts (Add payroll route)
```

---

**Document Status:** Draft  
**Last Updated:** 2026-02-08  
**Version:** 1.0
