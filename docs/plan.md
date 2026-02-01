Plan: Incorporate PRD Requirements into Angular Codebase
Extend the existing Angular app to implement the 5-tile geotechnical system from PRD, building on current Operations strengths (Excel parsing, Firestore) by adding modular feature modules for Personnel, Supply Chain, Fleet, and Finance, integrating offline-first sync, and redesigning UI as a Fiori-like tile launchpad for role-based, field-friendly access.

Steps
Modularize app into 5 lazy-loaded feature modules: Create src/app/modules/operations/, personnel/, supply-chain/, fleet/, finance/ with routing and components.
Implement Personnel, Fleet, Supply Chain, Finance modules: Add components like OnboardingComponent, AssetRegisterComponent, MaterialMasterComponent, InvoicingDashboardComponent; create services (PersonnelService, FleetService, etc.) for CRUD and workflows.
Expand data models and Firestore: Update models/index.ts and firestore.service.ts for new interfaces (e.g., Employee, Vehicle, Invoice); add collections and rules for orgId isolation.
 Enhance Operations module: Extend upload.component.ts and excel-parsing.service.ts for aquifer Excel validation (Time, Water Level, Discharge Rate) and graph previews; add OhsFormComponent with photo/signature uploads.
Integrate offline-first capabilities: Add OfflineSyncService using IndexedDB for queueing uploads; update app.config.ts for PWA support.
Redesign UI to tile-based launchpad: Modify app.html and app.routes.ts for 5 semantic tile groups with role-based visibility; ensure high-contrast, mobile-first styling.
Further Considerations
Prioritize MVP: Start with Operations extensions (aquifer parsing, OHS), then Personnel/Fleet registers, followed by Supply Chain/Finance workflows.
Offline handling: Use ngx-pwa for sync or custom IndexedDB; confirm Firebase offline persistence meets remote site needs.
Security and testing: Update Firestore rules for new collections; add E2E tests for upload/invoicing flows.
