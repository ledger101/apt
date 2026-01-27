# Todo Checklist for Implementing Plan.md

This checklist outlines the actionable items to incorporate the PRD requirements into the Angular codebase. Items are grouped by plan steps and prioritized for MVP focus. Check off items as implementation proceeds.

## 1. Modularize App into 5 Lazy-Loaded Feature Modules
- [x] Create `src/app/modules/operations/` directory with module, routing, and components
- [ ] Create `src/app/modules/personnel/` directory with module, routing, and components
- [ ] Create `src/app/modules/supply-chain/` directory with module, routing, and components
- [ ] Create `src/app/modules/fleet/` directory with module, routing, and components
- [ ] Create `src/app/modules/finance/` directory with module, routing, and components
- [ ] Update `app.routes.ts` to lazy-load each module

## 2. Implement Personnel, Fleet, Supply Chain, Finance Modules
### Personnel Module
- [x] Add `OnboardingComponent` for digital onboarding and certifications
- [x] Add `LeaveTrackingComponent` for attendance and leave management
- [x] Create `PersonnelService` for CRUD operations on employees, certifications, and leave requests

### Fleet Module
- [ ] Add `AssetRegisterComponent` for vehicle and rig registration
- [ ] Add `MaintenanceAlertsComponent` for scheduled service alerts based on mileage/hours
- [ ] Add `LogisticsComponent` for real-time tracking of machine location and status
- [ ] Create `FleetService` for asset management and alerts

### Supply Chain Module
- [ ] Add `MaterialMasterComponent` for hierarchical material repository
- [ ] Add `RequisitionWorkflowComponent` for field-to-office approval process
- [ ] Add `InventoryDrawdownComponent` for site-specific inventory tracking
- [ ] Create `SupplyChainService` for material and requisition CRUD

### Finance Module
- [ ] Add `InvoicingDashboardComponent` for progress-to-invoice automation
- [ ] Add `ExpenseAnalysisComponent` for budget vs. actuals comparison
- [ ] Add `CashflowComponent` for inflows and expenses visibility
- [ ] Create `FinanceService` for invoice generation and cashflow calculations

## 3. Expand Data Models and Firestore
- [ ] Update `models/index.ts` to add interfaces: `Employee`, `Certification`, `LeaveRequest`, `Vehicle`, `Rig`, `MaintenanceSchedule`, `Material`, `Requisition`, `Invoice`, `Expense`, `Budget`
- [ ] Update `firestore.service.ts` to handle new collections (employees, certifications, leave, vehicles, rigs, materials, requisitions, invoices, expenses)
- [ ] Update `firestore.rules` for orgId-based isolation across all new collections
- [ ] Update `storage.rules` if needed for photo/signature uploads

## 4. Enhance Operations Module
- [x] Extend `upload.component.ts` to support aquifer Excel files (.xlsx/.csv) with validation for headers (Time, Water Level, Discharge Rate)
- [x] Extend `excel-parsing.service.ts` to parse aquifer data and generate drawdown curve previews
- [ ] Add `OhsFormComponent` with dynamic forms, photo uploads, digital signatures, and alerts for critical failures
- [x] Update `firestore.service.ts` to save aquifer data and OHS submissions

## 5. Integrate Offline-First Capabilities
- [ ] Add `OfflineSyncService` using IndexedDB for queueing uploads and data when offline
- [ ] Update `app.config.ts` for PWA support (service worker, manifest)
- [ ] Confirm and leverage Firebase offline persistence for remote site needs
- [ ] Test sync behavior on reconnect

## 6. Redesign UI to Tile-Based Launchpad
- [ ] Modify `app.html` to implement Fiori-like launchpad with 5 semantic tile groups
- [ ] Update `app.routes.ts` for role-based tile visibility (e.g., field techs see Operations/OHS)
- [ ] Ensure high-contrast, mobile-first styling using Tailwind CSS
- [ ] Add global search and breadcrumbs for navigation

## Further Considerations
- [ ] Prioritize MVP: Complete Operations extensions first, then Personnel/Fleet, followed by Supply Chain/Finance
- [ ] Offline Handling: Decide on ngx-pwa or custom IndexedDB implementation
- [ ] Security and Testing: Update Firestore rules for new collections; add E2E tests for upload/invoicing flows
- [ ] Add unit tests for new services and components
- [ ] Update README.md with setup instructions for new modules and PWA

## Notes
- Track progress by checking off completed items.
- Update this file as new tasks arise or priorities shift.
- Estimated effort: 8-12 weeks for MVP.</content>
<parameter name="filePath">c:\Users\kuziw\APPS\testPad\todoList.md